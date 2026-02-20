alter table public.products
add column if not exists threshold integer;

alter table public.products
alter column threshold set default 20;

update public.products as p
set threshold = coalesce(source.threshold, 20)
from (
  select
    p2.id as product_id,
    (
      select ii.threshold
      from public.inventory_items as ii
      where ii.product_id = p2.id
      order by ii.last_updated desc nulls last, ii.id desc
      limit 1
    ) as threshold
  from public.products as p2
) as source
where p.id = source.product_id
  and (
    p.threshold is null
    or p.threshold is distinct from coalesce(source.threshold, 20)
  );

update public.products
set threshold = 20
where threshold is null;

alter table public.products
alter column threshold set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_threshold_non_negative_chk'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_threshold_non_negative_chk
      check (threshold >= 0);
  end if;
end $$;

update public.inventory_items as ii
set threshold = p.threshold
from public.products as p
where p.id = ii.product_id
  and ii.threshold is distinct from p.threshold;

create or replace function public.sync_inventory_threshold_from_product()
returns trigger
language plpgsql
as $$
begin
  if new.threshold is distinct from old.threshold then
    update public.inventory_items
    set threshold = new.threshold
    where product_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists products_sync_inventory_threshold on public.products;
create trigger products_sync_inventory_threshold
after update of threshold on public.products
for each row
execute function public.sync_inventory_threshold_from_product();

create or replace function public.set_inventory_threshold_from_product()
returns trigger
language plpgsql
as $$
declare
  v_threshold integer;
begin
  select threshold
    into v_threshold
  from public.products
  where id = new.product_id;

  new.threshold := coalesce(v_threshold, 20);
  return new;
end;
$$;

drop trigger if exists inventory_items_set_threshold_from_product on public.inventory_items;
create trigger inventory_items_set_threshold_from_product
before insert on public.inventory_items
for each row
execute function public.set_inventory_threshold_from_product();
