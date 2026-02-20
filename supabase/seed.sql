-- Seed operational catalog and sample inventory/orders.
-- Seeds into arjun@storesync.in personal workspace if that auth user exists.

do $$
declare
  v_user_id uuid;
begin
  select u.id
    into v_user_id
  from auth.users u
  where lower(u.email) = lower('arjun@storesync.in')
  limit 1;

  if v_user_id is not null then
    perform public.ensure_personal_workspace(v_user_id, 'arjun@storesync.in');
  else
    raise notice 'Auth user arjun@storesync.in not found. Seed catalog inserts will be skipped.';
  end if;
end $$;

with workspace as (
  select wm.workspace_id as id
  from public.workspace_members wm
  join auth.users u
    on u.id = wm.user_id
  where lower(u.email) = lower('arjun@storesync.in')
  limit 1
)
insert into public.locations (id, workspace_id, name, type, city, is_active)
select
  v.id,
  workspace.id,
  v.name,
  v.type::public.location_type,
  v.city,
  v.is_active
from workspace
cross join (
  values
    ('00000000-0000-0000-0000-000000000101'::uuid, 'Mumbai Warehouse'::text, 'warehouse'::text, 'Mumbai'::text, true),
    ('00000000-0000-0000-0000-000000000102'::uuid, 'Delhi Store'::text, 'store'::text, 'Delhi'::text, true),
    ('00000000-0000-0000-0000-000000000103'::uuid, 'Online Store'::text, 'online'::text, 'Pan India'::text, true)
) as v(id, name, type, city, is_active)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  type = excluded.type,
  city = excluded.city,
  is_active = excluded.is_active;

with workspace as (
  select wm.workspace_id as id
  from public.workspace_members wm
  join auth.users u
    on u.id = wm.user_id
  where lower(u.email) = lower('arjun@storesync.in')
  limit 1
)
insert into public.products (id, workspace_id, name, sku, category, threshold, is_active)
select
  v.id,
  workspace.id,
  v.name,
  v.sku,
  v.category,
  v.threshold,
  v.is_active
from workspace
cross join (
  values
    ('00000000-0000-0000-0000-000000000201'::uuid, 'White Air Force 1'::text, 'NK-AF1-WHT'::text, 'Footwear'::text, 20, true),
    ('00000000-0000-0000-0000-000000000202'::uuid, 'Black Puma Hoodie'::text, 'PM-HD-BLK'::text, 'Apparel'::text, 15, true),
    ('00000000-0000-0000-0000-000000000203'::uuid, 'Blue Denim Jacket'::text, 'LV-DJ-BLU'::text, 'Apparel'::text, 10, true),
    ('00000000-0000-0000-0000-000000000204'::uuid, 'Red Running Shorts'::text, 'AD-RS-RED'::text, 'Apparel'::text, 25, true),
    ('00000000-0000-0000-0000-000000000205'::uuid, 'Grey Joggers'::text, 'NK-JG-GRY'::text, 'Bottomwear'::text, 20, true),
    ('00000000-0000-0000-0000-000000000206'::uuid, 'Black Leather Belt'::text, 'GU-BL-BLK'::text, 'Accessories'::text, 10, true),
    ('00000000-0000-0000-0000-000000000207'::uuid, 'White Polo Shirt'::text, 'RL-PS-WHT'::text, 'Apparel'::text, 20, true),
    ('00000000-0000-0000-0000-000000000208'::uuid, 'Navy Chinos'::text, 'ZR-CH-NVY'::text, 'Bottomwear'::text, 20, true)
) as v(id, name, sku, category, threshold, is_active)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  name = excluded.name,
  sku = excluded.sku,
  category = excluded.category,
  threshold = excluded.threshold,
  is_active = excluded.is_active;

with workspace as (
  select wm.workspace_id as id
  from public.workspace_members wm
  join auth.users u
    on u.id = wm.user_id
  where lower(u.email) = lower('arjun@storesync.in')
  limit 1
)
insert into public.inventory_items (workspace_id, product_id, location_id, quantity, threshold, last_updated)
select
  workspace.id,
  v.product_id,
  v.location_id,
  v.quantity,
  v.threshold,
  v.last_updated
from workspace
cross join (
  values
    ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 142, 20, timezone('utc', now()) - interval '2 hours'),
    ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 12, 20, timezone('utc', now()) - interval '1 hours'),
    ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 89, 20, timezone('utc', now()) - interval '3 hours'),
    ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 67, 15, timezone('utc', now()) - interval '4 hours'),
    ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 34, 15, timezone('utc', now()) - interval '5 hours'),
    ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 8, 15, timezone('utc', now()) - interval '1 hours'),
    ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 23, 10, timezone('utc', now()) - interval '6 hours'),
    ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 5, 10, timezone('utc', now()) - interval '2 hours'),
    ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 78, 10, timezone('utc', now()) - interval '7 hours'),
    ('00000000-0000-0000-0000-000000000204'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 190, 25, timezone('utc', now()) - interval '3 hours'),
    ('00000000-0000-0000-0000-000000000204'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 45, 25, timezone('utc', now()) - interval '8 hours'),
    ('00000000-0000-0000-0000-000000000204'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 22, 25, timezone('utc', now()) - interval '4 hours'),
    ('00000000-0000-0000-0000-000000000205'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 3, 20, timezone('utc', now()) - interval '1 hours'),
    ('00000000-0000-0000-0000-000000000205'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 61, 20, timezone('utc', now()) - interval '9 hours'),
    ('00000000-0000-0000-0000-000000000205'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 18, 20, timezone('utc', now()) - interval '2 hours'),
    ('00000000-0000-0000-0000-000000000206'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 88, 10, timezone('utc', now()) - interval '5 hours'),
    ('00000000-0000-0000-0000-000000000206'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 7, 10, timezone('utc', now()) - interval '3 hours'),
    ('00000000-0000-0000-0000-000000000206'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 55, 10, timezone('utc', now()) - interval '10 hours'),
    ('00000000-0000-0000-0000-000000000207'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 110, 20, timezone('utc', now()) - interval '4 hours'),
    ('00000000-0000-0000-0000-000000000207'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 29, 20, timezone('utc', now()) - interval '6 hours'),
    ('00000000-0000-0000-0000-000000000207'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 44, 20, timezone('utc', now()) - interval '11 hours'),
    ('00000000-0000-0000-0000-000000000208'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 16, 20, timezone('utc', now()) - interval '2 hours'),
    ('00000000-0000-0000-0000-000000000208'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 72, 20, timezone('utc', now()) - interval '7 hours'),
    ('00000000-0000-0000-0000-000000000208'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, 33, 20, timezone('utc', now()) - interval '3 hours')
) as v(product_id, location_id, quantity, threshold, last_updated)
on conflict (product_id, location_id) do update
set
  workspace_id = excluded.workspace_id,
  quantity = excluded.quantity,
  threshold = excluded.threshold,
  last_updated = excluded.last_updated;

with workspace as (
  select wm.workspace_id as id
  from public.workspace_members wm
  join auth.users u
    on u.id = wm.user_id
  where lower(u.email) = lower('arjun@storesync.in')
  limit 1
)
insert into public.orders (workspace_id, product_id, location_id, to_location_id, type, quantity, source, note, "timestamp")
select
  workspace.id,
  v.product_id,
  v.location_id,
  v.to_location_id,
  v.type::public.order_type,
  v.quantity,
  v.source::public.order_source,
  v.note,
  v."timestamp"
from workspace
cross join (
  values
    ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, null::uuid, 'sale'::text, 3, 'manual'::text, 'Walk-in customer'::text, timezone('utc', now()) - interval '5 minutes'),
    ('00000000-0000-0000-0000-000000000205'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, null::uuid, 'restock'::text, 50, 'ai'::text, 'AI auto-restock triggered'::text, timezone('utc', now()) - interval '12 minutes'),
    ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, null::uuid, 'sale'::text, 2, 'manual'::text, 'Online order fulfillment'::text, timezone('utc', now()) - interval '25 minutes'),
    ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, null::uuid, 'restock'::text, 30, 'manual'::text, 'Weekly restock'::text, timezone('utc', now()) - interval '45 minutes'),
    ('00000000-0000-0000-0000-000000000206'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'transfer'::text, 15, 'ai'::text, 'Transfer from Mumbai warehouse'::text, timezone('utc', now()) - interval '1 hour'),
    ('00000000-0000-0000-0000-000000000204'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, null::uuid, 'sale'::text, 8, 'manual'::text, 'Bulk order'::text, timezone('utc', now()) - interval '2 hours'),
    ('00000000-0000-0000-0000-000000000207'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, null::uuid, 'sale'::text, 5, 'manual'::text, 'Website checkout'::text, timezone('utc', now()) - interval '3 hours'),
    ('00000000-0000-0000-0000-000000000201'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, null::uuid, 'restock'::text, 100, 'manual'::text, 'New shipment arrived'::text, timezone('utc', now()) - interval '4 hours'),
    ('00000000-0000-0000-0000-000000000208'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, 'transfer'::text, 20, 'ai'::text, 'Redistributing to Delhi'::text, timezone('utc', now()) - interval '5 hours'),
    ('00000000-0000-0000-0000-000000000203'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, null::uuid, 'sale'::text, 1, 'manual'::text, 'Express delivery'::text, timezone('utc', now()) - interval '6 hours'),
    ('00000000-0000-0000-0000-000000000205'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, null::uuid, 'sale'::text, 4, 'manual'::text, 'Store purchase'::text, timezone('utc', now()) - interval '8 hours'),
    ('00000000-0000-0000-0000-000000000202'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, null::uuid, 'restock'::text, 25, 'ai'::text, 'Predicted demand spike'::text, timezone('utc', now()) - interval '10 hours'),
    ('00000000-0000-0000-0000-000000000204'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, 'transfer'::text, 10, 'manual'::text, 'Moving to online store'::text, timezone('utc', now()) - interval '14 hours'),
    ('00000000-0000-0000-0000-000000000206'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, null::uuid, 'sale'::text, 6, 'manual'::text, 'Corporate gifting order'::text, timezone('utc', now()) - interval '18 hours'),
    ('00000000-0000-0000-0000-000000000207'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, null::uuid, 'restock'::text, 40, 'ai'::text, 'Auto-restock: below threshold'::text, timezone('utc', now()) - interval '22 hours')
) as v(product_id, location_id, to_location_id, type, quantity, source, note, "timestamp")
on conflict do nothing;

insert into public.profiles (id, name, email, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', 'Arjun Mehta'),
  u.email,
  'Store Manager'
from auth.users u
where u.email = 'arjun@storesync.in'
on conflict (id) do update
set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role;

insert into public.user_settings (user_id)
select p.id
from public.profiles p
where p.email = 'arjun@storesync.in'
on conflict (user_id) do update
set
  notify_low_stock = excluded.notify_low_stock,
  notify_order_confirmations = excluded.notify_order_confirmations,
  notify_daily_summary = excluded.notify_daily_summary,
  notify_ai_actions = excluded.notify_ai_actions,
  default_threshold = excluded.default_threshold,
  accent_color = excluded.accent_color,
  density = excluded.density;
