-- Multi-tenant isolation (per-user workspace v1)

-- Tenancy primitives
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id),
  unique (user_id)
);

create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

-- Workspace helpers
create or replace function public.current_workspace_id()
returns uuid
language sql
stable
as $$
  select wm.workspace_id
  from public.workspace_members wm
  where wm.user_id = auth.uid()
  order by wm.created_at asc
  limit 1;
$$;

create or replace function public.ensure_personal_workspace(p_user_id uuid, p_email text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_workspace_name text;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select wm.workspace_id
    into v_workspace_id
  from public.workspace_members wm
  where wm.user_id = p_user_id
  limit 1;

  if v_workspace_id is not null then
    return v_workspace_id;
  end if;

  v_workspace_name := coalesce(nullif(split_part(coalesce(p_email, ''), '@', 1), ''), 'My');

  insert into public.workspaces (name, created_by)
  values (v_workspace_name || ' Workspace', p_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, p_user_id, 'owner')
  on conflict (user_id) do update
    set workspace_id = excluded.workspace_id,
        role = excluded.role;

  select wm.workspace_id
    into v_workspace_id
  from public.workspace_members wm
  where wm.user_id = p_user_id
  limit 1;

  return v_workspace_id;
end;
$$;

revoke all on function public.ensure_personal_workspace(uuid, text) from public;

-- Extend new-user bootstrap to always provision workspace
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    'Store Manager'
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  perform public.ensure_personal_workspace(new.id, new.email);

  return new;
end;
$$;

-- Add tenant key to domain tables
alter table public.products
add column if not exists workspace_id uuid;

alter table public.locations
add column if not exists workspace_id uuid;

alter table public.inventory_items
add column if not exists workspace_id uuid;

alter table public.orders
add column if not exists workspace_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_workspace_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces (id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'locations_workspace_id_fkey'
      and conrelid = 'public.locations'::regclass
  ) then
    alter table public.locations
      add constraint locations_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces (id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inventory_items_workspace_id_fkey'
      and conrelid = 'public.inventory_items'::regclass
  ) then
    alter table public.inventory_items
      add constraint inventory_items_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces (id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_workspace_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces (id)
      on delete cascade;
  end if;
end $$;

create index if not exists products_workspace_id_idx on public.products (workspace_id);
create index if not exists locations_workspace_id_idx on public.locations (workspace_id);
create index if not exists inventory_items_workspace_id_idx on public.inventory_items (workspace_id);
create index if not exists orders_workspace_id_idx on public.orders (workspace_id);

alter table public.products
alter column workspace_id set default public.current_workspace_id();

alter table public.locations
alter column workspace_id set default public.current_workspace_id();

-- Archive existing shared rows into hidden legacy workspace
do $$
declare
  v_legacy_workspace_id uuid;
  v_owner_id uuid;
begin
  select id
    into v_owner_id
  from auth.users
  order by created_at asc
  limit 1;

  if v_owner_id is null then
    if exists (select 1 from public.products where workspace_id is null)
      or exists (select 1 from public.locations where workspace_id is null)
      or exists (select 1 from public.inventory_items where workspace_id is null)
      or exists (select 1 from public.orders where workspace_id is null) then
      raise exception 'Cannot migrate shared data without at least one auth.users row';
    end if;

    return;
  end if;

  select id
    into v_legacy_workspace_id
  from public.workspaces
  where name = 'Legacy Shared Archive'
    and created_by = v_owner_id
  order by created_at asc
  limit 1;

  if v_legacy_workspace_id is null then
    insert into public.workspaces (name, created_by)
    values ('Legacy Shared Archive', v_owner_id)
    returning id into v_legacy_workspace_id;
  end if;

  update public.products
  set workspace_id = v_legacy_workspace_id
  where workspace_id is null;

  update public.locations
  set workspace_id = v_legacy_workspace_id
  where workspace_id is null;

  update public.inventory_items ii
  set workspace_id = p.workspace_id
  from public.products p
  where p.id = ii.product_id
    and (ii.workspace_id is null or ii.workspace_id is distinct from p.workspace_id);

  update public.orders o
  set workspace_id = p.workspace_id
  from public.products p
  where p.id = o.product_id
    and (o.workspace_id is null or o.workspace_id is distinct from p.workspace_id);

  update public.orders
  set workspace_id = v_legacy_workspace_id
  where workspace_id is null;
end $$;

-- Ensure every existing user has one personal workspace
do $$
declare
  v_user record;
begin
  for v_user in
    select id, email
    from auth.users
  loop
    perform public.ensure_personal_workspace(v_user.id, v_user.email);
  end loop;
end $$;

-- Enforce tenant key presence + workspace-scoped SKU uniqueness
do $$
begin
  if exists (select 1 from public.products where workspace_id is null) then
    raise exception 'products.workspace_id contains null values';
  end if;

  if exists (select 1 from public.locations where workspace_id is null) then
    raise exception 'locations.workspace_id contains null values';
  end if;

  if exists (select 1 from public.inventory_items where workspace_id is null) then
    raise exception 'inventory_items.workspace_id contains null values';
  end if;

  if exists (select 1 from public.orders where workspace_id is null) then
    raise exception 'orders.workspace_id contains null values';
  end if;
end $$;

alter table public.products
alter column workspace_id set not null;

alter table public.locations
alter column workspace_id set not null;

alter table public.inventory_items
alter column workspace_id set not null;

alter table public.orders
alter column workspace_id set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'products_sku_key'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      drop constraint products_sku_key;
  end if;
end $$;

create unique index if not exists products_workspace_sku_unique_idx
  on public.products (workspace_id, sku);

-- Workspace consistency triggers
create or replace function public.enforce_inventory_item_workspace_and_threshold()
returns trigger
language plpgsql
as $$
declare
  v_product_workspace_id uuid;
  v_location_workspace_id uuid;
  v_product_threshold integer;
begin
  select p.workspace_id, p.threshold
    into v_product_workspace_id, v_product_threshold
  from public.products p
  where p.id = new.product_id;

  if v_product_workspace_id is null then
    raise exception 'Product not found for inventory entry.';
  end if;

  select l.workspace_id
    into v_location_workspace_id
  from public.locations l
  where l.id = new.location_id;

  if v_location_workspace_id is null then
    raise exception 'Location not found for inventory entry.';
  end if;

  if v_product_workspace_id <> v_location_workspace_id then
    raise exception 'Product and location must belong to same workspace.';
  end if;

  new.workspace_id := v_product_workspace_id;
  new.threshold := coalesce(v_product_threshold, 20);
  return new;
end;
$$;

drop trigger if exists inventory_items_set_threshold_from_product on public.inventory_items;
drop trigger if exists inventory_items_enforce_workspace on public.inventory_items;
create trigger inventory_items_enforce_workspace
before insert or update on public.inventory_items
for each row
execute function public.enforce_inventory_item_workspace_and_threshold();

drop function if exists public.set_inventory_threshold_from_product();

create or replace function public.enforce_orders_workspace_consistency()
returns trigger
language plpgsql
as $$
declare
  v_product_workspace_id uuid;
  v_location_workspace_id uuid;
  v_to_location_workspace_id uuid;
begin
  select p.workspace_id
    into v_product_workspace_id
  from public.products p
  where p.id = new.product_id;

  if v_product_workspace_id is null then
    raise exception 'Product not found for order.';
  end if;

  select l.workspace_id
    into v_location_workspace_id
  from public.locations l
  where l.id = new.location_id;

  if v_location_workspace_id is null then
    raise exception 'Location not found for order.';
  end if;

  if v_product_workspace_id <> v_location_workspace_id then
    raise exception 'Order product and location must belong to same workspace.';
  end if;

  if new.to_location_id is not null then
    select l.workspace_id
      into v_to_location_workspace_id
    from public.locations l
    where l.id = new.to_location_id;

    if v_to_location_workspace_id is null then
      raise exception 'To location not found for order.';
    end if;

    if v_to_location_workspace_id <> v_product_workspace_id then
      raise exception 'Transfer order locations must belong to same workspace.';
    end if;
  end if;

  new.workspace_id := v_product_workspace_id;
  return new;
end;
$$;

drop trigger if exists orders_enforce_workspace on public.orders;
create trigger orders_enforce_workspace
before insert or update on public.orders
for each row
execute function public.enforce_orders_workspace_consistency();

-- Tenant-aware atomic mutations
create or replace function public.create_order_and_apply_inventory(
  p_product_id uuid,
  p_location_id uuid,
  p_type public.order_type,
  p_quantity integer,
  p_source public.order_source,
  p_note text default ''
)
returns public.orders
language plpgsql
volatile
security invoker
as $$
declare
  v_workspace_id uuid;
  v_inventory public.inventory_items;
  v_new_qty integer;
  v_order public.orders;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  v_workspace_id := public.current_workspace_id();
  if v_workspace_id is null then
    raise exception 'No workspace membership found for current user.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and p.workspace_id = v_workspace_id
  ) then
    raise exception 'Product not found in current workspace.';
  end if;

  if not exists (
    select 1
    from public.locations l
    where l.id = p_location_id
      and l.workspace_id = v_workspace_id
  ) then
    raise exception 'Location not found in current workspace.';
  end if;

  select *
    into v_inventory
  from public.inventory_items
  where product_id = p_product_id
    and location_id = p_location_id
    and workspace_id = v_workspace_id
  for update;

  if not found then
    raise exception 'Inventory item not found for product % at location %', p_product_id, p_location_id;
  end if;

  if p_type = 'sale' then
    if v_inventory.quantity < p_quantity then
      raise exception 'Current QTY is % and order is %. Sale order can''t be created.', v_inventory.quantity, p_quantity;
    end if;
    v_new_qty := v_inventory.quantity - p_quantity;
  elsif p_type = 'restock' then
    v_new_qty := v_inventory.quantity + p_quantity;
  else
    v_new_qty := v_inventory.quantity;
  end if;

  update public.inventory_items
  set quantity = v_new_qty
  where id = v_inventory.id;

  insert into public.orders (workspace_id, product_id, location_id, type, quantity, source, note)
  values (v_workspace_id, p_product_id, p_location_id, p_type, p_quantity, p_source, coalesce(p_note, ''))
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.create_transfer_order_and_move_inventory(
  p_product_id uuid,
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_quantity integer,
  p_note text default '',
  p_source public.order_source default 'manual'
)
returns public.orders
language plpgsql
volatile
security invoker
as $$
declare
  v_workspace_id uuid;
  v_source public.inventory_items;
  v_destination public.inventory_items;
  v_available integer := 0;
  v_threshold integer := 20;
  v_order public.orders;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  if p_from_location_id is null or p_to_location_id is null then
    raise exception 'From location and to location are required for transfer orders.';
  end if;

  if p_from_location_id = p_to_location_id then
    raise exception 'From location and to location must be different for transfer orders.';
  end if;

  v_workspace_id := public.current_workspace_id();
  if v_workspace_id is null then
    raise exception 'No workspace membership found for current user.';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and p.workspace_id = v_workspace_id
  ) then
    raise exception 'Product not found in current workspace.';
  end if;

  if not exists (
    select 1
    from public.locations l
    where l.id = p_from_location_id
      and l.workspace_id = v_workspace_id
  ) then
    raise exception 'From location not found in current workspace.';
  end if;

  if not exists (
    select 1
    from public.locations l
    where l.id = p_to_location_id
      and l.workspace_id = v_workspace_id
  ) then
    raise exception 'To location not found in current workspace.';
  end if;

  select *
    into v_source
  from public.inventory_items
  where product_id = p_product_id
    and location_id = p_from_location_id
    and workspace_id = v_workspace_id
  for update;

  if found then
    v_available := v_source.quantity;
    v_threshold := v_source.threshold;
  end if;

  if v_available < p_quantity then
    raise exception 'Current QTY is % and order is %. Transfer order can''t be created.', v_available, p_quantity;
  end if;

  insert into public.inventory_items (workspace_id, product_id, location_id, quantity, threshold)
  values (v_workspace_id, p_product_id, p_to_location_id, 0, v_threshold)
  on conflict (product_id, location_id) do nothing;

  select *
    into v_destination
  from public.inventory_items
  where product_id = p_product_id
    and location_id = p_to_location_id
    and workspace_id = v_workspace_id
  for update;

  if not found then
    raise exception 'Destination inventory row could not be initialized.';
  end if;

  update public.inventory_items
  set quantity = v_available - p_quantity
  where id = v_source.id;

  update public.inventory_items
  set quantity = v_destination.quantity + p_quantity
  where id = v_destination.id;

  insert into public.orders (workspace_id, product_id, location_id, to_location_id, type, quantity, source, note)
  values (
    v_workspace_id,
    p_product_id,
    p_from_location_id,
    p_to_location_id,
    'transfer',
    p_quantity,
    coalesce(p_source, 'manual'),
    coalesce(p_note, '')
  )
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.archive_product_and_remove_inventory(target_product_id uuid)
returns boolean
language plpgsql
volatile
security invoker
as $$
declare
  v_workspace_id uuid;
begin
  v_workspace_id := public.current_workspace_id();
  if v_workspace_id is null then
    raise exception 'No workspace membership found for current user.';
  end if;

  update public.products
  set is_active = false
  where id = target_product_id
    and workspace_id = v_workspace_id;

  if not found then
    return false;
  end if;

  delete from public.inventory_items
  where product_id = target_product_id
    and workspace_id = v_workspace_id;

  return true;
end;
$$;

grant execute on function public.current_workspace_id() to authenticated;
grant execute on function public.create_order_and_apply_inventory(uuid, uuid, public.order_type, integer, public.order_source, text) to authenticated;
grant execute on function public.create_transfer_order_and_move_inventory(uuid, uuid, uuid, integer, text, public.order_source) to authenticated;
grant execute on function public.archive_product_and_remove_inventory(uuid) to authenticated;

-- RLS rewrite for domain tables (workspace scoped)
drop policy if exists products_select_authenticated on public.products;
drop policy if exists products_insert_authenticated on public.products;
drop policy if exists products_update_authenticated on public.products;
drop policy if exists products_delete_authenticated on public.products;
drop policy if exists products_select_workspace on public.products;
drop policy if exists products_insert_workspace on public.products;
drop policy if exists products_update_workspace on public.products;
drop policy if exists products_delete_workspace on public.products;

create policy products_select_workspace on public.products
for select
using (workspace_id = public.current_workspace_id());

create policy products_insert_workspace on public.products
for insert
with check (workspace_id = public.current_workspace_id());

create policy products_update_workspace on public.products
for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy products_delete_workspace on public.products
for delete
using (workspace_id = public.current_workspace_id());

drop policy if exists locations_select_authenticated on public.locations;
drop policy if exists locations_insert_authenticated on public.locations;
drop policy if exists locations_update_authenticated on public.locations;
drop policy if exists locations_delete_authenticated on public.locations;
drop policy if exists locations_select_workspace on public.locations;
drop policy if exists locations_insert_workspace on public.locations;
drop policy if exists locations_update_workspace on public.locations;
drop policy if exists locations_delete_workspace on public.locations;

create policy locations_select_workspace on public.locations
for select
using (workspace_id = public.current_workspace_id());

create policy locations_insert_workspace on public.locations
for insert
with check (workspace_id = public.current_workspace_id());

create policy locations_update_workspace on public.locations
for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy locations_delete_workspace on public.locations
for delete
using (workspace_id = public.current_workspace_id());

drop policy if exists inventory_items_select_authenticated on public.inventory_items;
drop policy if exists inventory_items_insert_authenticated on public.inventory_items;
drop policy if exists inventory_items_update_authenticated on public.inventory_items;
drop policy if exists inventory_items_delete_authenticated on public.inventory_items;
drop policy if exists inventory_items_select_workspace on public.inventory_items;
drop policy if exists inventory_items_insert_workspace on public.inventory_items;
drop policy if exists inventory_items_update_workspace on public.inventory_items;
drop policy if exists inventory_items_delete_workspace on public.inventory_items;

create policy inventory_items_select_workspace on public.inventory_items
for select
using (workspace_id = public.current_workspace_id());

create policy inventory_items_insert_workspace on public.inventory_items
for insert
with check (workspace_id = public.current_workspace_id());

create policy inventory_items_update_workspace on public.inventory_items
for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy inventory_items_delete_workspace on public.inventory_items
for delete
using (workspace_id = public.current_workspace_id());

drop policy if exists orders_select_authenticated on public.orders;
drop policy if exists orders_insert_authenticated on public.orders;
drop policy if exists orders_update_authenticated on public.orders;
drop policy if exists orders_delete_authenticated on public.orders;
drop policy if exists orders_select_workspace on public.orders;
drop policy if exists orders_insert_workspace on public.orders;
drop policy if exists orders_update_workspace on public.orders;
drop policy if exists orders_delete_workspace on public.orders;

create policy orders_select_workspace on public.orders
for select
using (workspace_id = public.current_workspace_id());

create policy orders_insert_workspace on public.orders
for insert
with check (workspace_id = public.current_workspace_id());

create policy orders_update_workspace on public.orders
for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy orders_delete_workspace on public.orders
for delete
using (workspace_id = public.current_workspace_id());

-- RLS for tenancy tables
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member on public.workspaces
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists workspace_members_select_self on public.workspace_members;
create policy workspace_members_select_self on public.workspace_members
for select
using (user_id = auth.uid());

grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
