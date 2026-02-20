-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists pg_graphql;

-- Enum types
do $$
begin
  create type public.location_type as enum ('warehouse', 'store', 'online');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_type as enum ('sale', 'restock', 'transfer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_source as enum ('manual', 'ai');
exception
  when duplicate_object then null;
end $$;

-- Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role text not null default 'Store Manager',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_email_unique_idx on public.profiles (lower(email));

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  notify_low_stock boolean not null default true,
  notify_order_confirmations boolean not null default true,
  notify_daily_summary boolean not null default false,
  notify_ai_actions boolean not null default true,
  default_threshold integer not null default 20 check (default_threshold >= 0),
  accent_color text not null default 'amber',
  density text not null default 'comfortable' check (density in ('comfortable', 'compact')),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_is_active_idx on public.products (is_active);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.location_type not null,
  city text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists locations_type_idx on public.locations (type);
create index if not exists locations_is_active_idx on public.locations (is_active);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  threshold integer not null default 20 check (threshold >= 0),
  last_updated timestamptz not null default timezone('utc', now()),
  unique (product_id, location_id)
);

create index if not exists inventory_items_product_id_idx on public.inventory_items (product_id);
create index if not exists inventory_items_location_id_idx on public.inventory_items (location_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  location_id uuid not null references public.locations (id),
  type public.order_type not null,
  quantity integer not null check (quantity > 0),
  source public.order_source not null default 'manual',
  note text not null default '',
  "timestamp" timestamptz not null default timezone('utc', now())
);

create index if not exists orders_timestamp_idx on public.orders ("timestamp" desc);
create index if not exists orders_type_idx on public.orders (type);
create index if not exists orders_source_idx on public.orders (source);
create index if not exists orders_product_id_idx on public.orders (product_id);
create index if not exists orders_location_id_idx on public.orders (location_id);

-- Utility triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
before update on public.locations
for each row
execute function public.set_updated_at();

drop trigger if exists inventory_items_set_last_updated on public.inventory_items;
create trigger inventory_items_set_last_updated
before update on public.inventory_items
for each row
execute function public.set_last_updated();

-- Provision profile + settings on signup
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Atomic mutations
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
  v_inventory public.inventory_items;
  v_new_qty integer;
  v_order public.orders;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select *
    into v_inventory
  from public.inventory_items
  where product_id = p_product_id
    and location_id = p_location_id
  for update;

  if not found then
    raise exception 'Inventory item not found for product % at location %', p_product_id, p_location_id;
  end if;

  if p_type = 'sale' then
    if v_inventory.quantity < p_quantity then
      raise exception 'Insufficient inventory for sale. Available: %, requested: %', v_inventory.quantity, p_quantity;
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

  insert into public.orders (product_id, location_id, type, quantity, source, note)
  values (p_product_id, p_location_id, p_type, p_quantity, p_source, coalesce(p_note, ''))
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
begin
  update public.products
  set is_active = false
  where id = target_product_id;

  if not found then
    return false;
  end if;

  delete from public.inventory_items
  where product_id = target_product_id;

  return true;
end;
$$;

grant execute on function public.create_order_and_apply_inventory(uuid, uuid, public.order_type, integer, public.order_source, text) to authenticated;
grant execute on function public.archive_product_and_remove_inventory(uuid) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.products enable row level security;
alter table public.locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.orders enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings
for select
using (auth.uid() = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists products_select_authenticated on public.products;
create policy products_select_authenticated on public.products
for select
using (auth.role() = 'authenticated');

drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated on public.products
for insert
with check (auth.role() = 'authenticated');

drop policy if exists products_update_authenticated on public.products;
create policy products_update_authenticated on public.products
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists products_delete_authenticated on public.products;
create policy products_delete_authenticated on public.products
for delete
using (auth.role() = 'authenticated');

drop policy if exists locations_select_authenticated on public.locations;
create policy locations_select_authenticated on public.locations
for select
using (auth.role() = 'authenticated');

drop policy if exists locations_insert_authenticated on public.locations;
create policy locations_insert_authenticated on public.locations
for insert
with check (auth.role() = 'authenticated');

drop policy if exists locations_update_authenticated on public.locations;
create policy locations_update_authenticated on public.locations
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists locations_delete_authenticated on public.locations;
create policy locations_delete_authenticated on public.locations
for delete
using (auth.role() = 'authenticated');

drop policy if exists inventory_items_select_authenticated on public.inventory_items;
create policy inventory_items_select_authenticated on public.inventory_items
for select
using (auth.role() = 'authenticated');

drop policy if exists inventory_items_insert_authenticated on public.inventory_items;
create policy inventory_items_insert_authenticated on public.inventory_items
for insert
with check (auth.role() = 'authenticated');

drop policy if exists inventory_items_update_authenticated on public.inventory_items;
create policy inventory_items_update_authenticated on public.inventory_items
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists inventory_items_delete_authenticated on public.inventory_items;
create policy inventory_items_delete_authenticated on public.inventory_items
for delete
using (auth.role() = 'authenticated');

drop policy if exists orders_select_authenticated on public.orders;
create policy orders_select_authenticated on public.orders
for select
using (auth.role() = 'authenticated');

drop policy if exists orders_insert_authenticated on public.orders;
create policy orders_insert_authenticated on public.orders
for insert
with check (auth.role() = 'authenticated');

drop policy if exists orders_update_authenticated on public.orders;
create policy orders_update_authenticated on public.orders
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists orders_delete_authenticated on public.orders;
create policy orders_delete_authenticated on public.orders
for delete
using (auth.role() = 'authenticated');
