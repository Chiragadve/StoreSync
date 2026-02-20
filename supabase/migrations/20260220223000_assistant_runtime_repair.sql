-- Assistant runtime repair: grants, RLS, and policy re-assertion

alter table if exists public.ai_command_runs enable row level security;
alter table if exists public.ai_command_actions enable row level security;

grant execute on function public.current_workspace_id() to authenticated;

do $$
begin
  if to_regclass('public.ai_command_runs') is not null then
    grant select, insert, update on public.ai_command_runs to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.ai_command_actions') is not null then
    grant select, insert, update on public.ai_command_actions to authenticated;
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.create_order_and_apply_inventory_graphql(uuid, uuid, text, integer, text, text)') is not null then
    grant execute on function public.create_order_and_apply_inventory_graphql(uuid, uuid, text, integer, text, text) to authenticated;
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.create_transfer_order_and_move_inventory_graphql(uuid, uuid, uuid, integer, text, text)') is not null then
    grant execute on function public.create_transfer_order_and_move_inventory_graphql(uuid, uuid, uuid, integer, text, text) to authenticated;
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.archive_product_and_remove_inventory_graphql(uuid)') is not null then
    grant execute on function public.archive_product_and_remove_inventory_graphql(uuid) to authenticated;
  end if;
end $$;

drop policy if exists ai_command_runs_select_own on public.ai_command_runs;
create policy ai_command_runs_select_own on public.ai_command_runs
for select
using (user_id = auth.uid() and workspace_id = public.current_workspace_id());

drop policy if exists ai_command_runs_insert_own on public.ai_command_runs;
create policy ai_command_runs_insert_own on public.ai_command_runs
for insert
with check (user_id = auth.uid() and workspace_id = public.current_workspace_id());

drop policy if exists ai_command_runs_update_own on public.ai_command_runs;
create policy ai_command_runs_update_own on public.ai_command_runs
for update
using (user_id = auth.uid() and workspace_id = public.current_workspace_id())
with check (user_id = auth.uid() and workspace_id = public.current_workspace_id());

drop policy if exists ai_command_actions_select_own on public.ai_command_actions;
create policy ai_command_actions_select_own on public.ai_command_actions
for select
using (
  user_id = auth.uid()
  and workspace_id = public.current_workspace_id()
  and exists (
    select 1
    from public.ai_command_runs r
    where r.id = run_id
      and r.user_id = auth.uid()
      and r.workspace_id = public.current_workspace_id()
  )
);

drop policy if exists ai_command_actions_insert_own on public.ai_command_actions;
create policy ai_command_actions_insert_own on public.ai_command_actions
for insert
with check (
  user_id = auth.uid()
  and workspace_id = public.current_workspace_id()
  and exists (
    select 1
    from public.ai_command_runs r
    where r.id = run_id
      and r.user_id = auth.uid()
      and r.workspace_id = public.current_workspace_id()
  )
);

drop policy if exists ai_command_actions_update_own on public.ai_command_actions;
create policy ai_command_actions_update_own on public.ai_command_actions
for update
using (
  user_id = auth.uid()
  and workspace_id = public.current_workspace_id()
  and exists (
    select 1
    from public.ai_command_runs r
    where r.id = run_id
      and r.user_id = auth.uid()
      and r.workspace_id = public.current_workspace_id()
  )
)
with check (
  user_id = auth.uid()
  and workspace_id = public.current_workspace_id()
  and exists (
    select 1
    from public.ai_command_runs r
    where r.id = run_id
      and r.user_id = auth.uid()
      and r.workspace_id = public.current_workspace_id()
  )
);
