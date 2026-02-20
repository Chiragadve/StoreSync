alter table public.orders
add column if not exists to_location_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_to_location_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_to_location_id_fkey
      foreign key (to_location_id)
      references public.locations (id);
  end if;
end $$;

create index if not exists orders_to_location_id_idx on public.orders (to_location_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_to_location_id_not_same_chk'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_to_location_id_not_same_chk
      check (to_location_id is null or to_location_id <> location_id);
  end if;
end $$;

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

  insert into public.orders (product_id, location_id, type, quantity, source, note)
  values (p_product_id, p_location_id, p_type, p_quantity, p_source, coalesce(p_note, ''))
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

  select *
    into v_source
  from public.inventory_items
  where product_id = p_product_id
    and location_id = p_from_location_id
  for update;

  if found then
    v_available := v_source.quantity;
    v_threshold := v_source.threshold;
  end if;

  if v_available < p_quantity then
    raise exception 'Current QTY is % and order is %. Transfer order can''t be created.', v_available, p_quantity;
  end if;

  insert into public.inventory_items (product_id, location_id, quantity, threshold)
  values (p_product_id, p_to_location_id, 0, v_threshold)
  on conflict (product_id, location_id) do nothing;

  select *
    into v_destination
  from public.inventory_items
  where product_id = p_product_id
    and location_id = p_to_location_id
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

  insert into public.orders (product_id, location_id, to_location_id, type, quantity, source, note)
  values (
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

grant execute on function public.create_order_and_apply_inventory(uuid, uuid, public.order_type, integer, public.order_source, text) to authenticated;
grant execute on function public.create_transfer_order_and_move_inventory(uuid, uuid, uuid, integer, text, public.order_source) to authenticated;
