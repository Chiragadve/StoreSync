create or replace function public.create_order_and_apply_inventory_graphql(
  p_product_id uuid,
  p_location_id uuid,
  p_type text,
  p_quantity integer,
  p_source text default 'manual',
  p_note text default ''
)
returns uuid
language plpgsql
volatile
security invoker
as $$
declare
  v_type public.order_type;
  v_source public.order_source;
  v_order public.orders;
begin
  begin
    v_type := p_type::public.order_type;
  exception
    when others then
      raise exception 'Invalid order type: %', p_type;
  end;

  begin
    v_source := coalesce(nullif(trim(p_source), ''), 'manual')::public.order_source;
  exception
    when others then
      raise exception 'Invalid order source: %', p_source;
  end;

  if v_type = 'transfer' then
    raise exception 'Transfer orders must use create_transfer_order_and_move_inventory_graphql.';
  end if;

  v_order := public.create_order_and_apply_inventory(
    p_product_id,
    p_location_id,
    v_type,
    p_quantity,
    v_source,
    p_note
  );

  return v_order.id;
end;
$$;

create or replace function public.create_transfer_order_and_move_inventory_graphql(
  p_product_id uuid,
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_quantity integer,
  p_note text default '',
  p_source text default 'manual'
)
returns uuid
language plpgsql
volatile
security invoker
as $$
declare
  v_source public.order_source;
  v_order public.orders;
begin
  begin
    v_source := coalesce(nullif(trim(p_source), ''), 'manual')::public.order_source;
  exception
    when others then
      raise exception 'Invalid order source: %', p_source;
  end;

  v_order := public.create_transfer_order_and_move_inventory(
    p_product_id,
    p_from_location_id,
    p_to_location_id,
    p_quantity,
    p_note,
    v_source
  );

  return v_order.id;
end;
$$;

grant execute on function public.create_order_and_apply_inventory_graphql(uuid, uuid, text, integer, text, text) to authenticated;
grant execute on function public.create_transfer_order_and_move_inventory_graphql(uuid, uuid, uuid, integer, text, text) to authenticated;
