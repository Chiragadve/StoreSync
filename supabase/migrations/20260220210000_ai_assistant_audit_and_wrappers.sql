-- AI assistant audit trail + GraphQL wrapper helpers

create table if not exists public.ai_command_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade default public.current_workspace_id(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  conversation_id text,
  prompt text not null,
  model text,
  status text not null check (
    status in (
      'processing',
      'needs_clarification',
      'needs_confirmation',
      'read_only_response',
      'executed',
      'failed',
      'cancelled'
    )
  ),
  assistant_message text not null default '',
  normalized_intent jsonb not null default '{}'::jsonb,
  clarification jsonb,
  execution_result jsonb,
  error text,
  confirmed_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_command_runs_workspace_id_idx
  on public.ai_command_runs (workspace_id);
create index if not exists ai_command_runs_user_id_idx
  on public.ai_command_runs (user_id);
create index if not exists ai_command_runs_created_at_idx
  on public.ai_command_runs (created_at desc);

create table if not exists public.ai_command_actions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_command_runs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade default public.current_workspace_id(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  action_index integer not null default 0,
  kind text not null,
  action_payload jsonb not null default '{}'::jsonb,
  resolved_payload jsonb not null default '{}'::jsonb,
  status text not null default 'planned' check (
    status in ('planned', 'validated', 'executed', 'failed', 'cancelled')
  ),
  error text,
  result jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (run_id, action_index)
);

create index if not exists ai_command_actions_run_id_idx
  on public.ai_command_actions (run_id);
create index if not exists ai_command_actions_workspace_id_idx
  on public.ai_command_actions (workspace_id);
create index if not exists ai_command_actions_user_id_idx
  on public.ai_command_actions (user_id);

create or replace function public.sync_ai_action_scope_from_run()
returns trigger
language plpgsql
as $$
declare
  v_workspace_id uuid;
  v_user_id uuid;
begin
  select workspace_id, user_id
    into v_workspace_id, v_user_id
  from public.ai_command_runs
  where id = new.run_id;

  if v_workspace_id is null or v_user_id is null then
    raise exception 'Invalid ai_command_runs reference for action row.';
  end if;

  new.workspace_id := v_workspace_id;
  new.user_id := v_user_id;
  return new;
end;
$$;

drop trigger if exists ai_command_runs_set_updated_at on public.ai_command_runs;
create trigger ai_command_runs_set_updated_at
before update on public.ai_command_runs
for each row
execute function public.set_updated_at();

drop trigger if exists ai_command_actions_set_updated_at on public.ai_command_actions;
create trigger ai_command_actions_set_updated_at
before update on public.ai_command_actions
for each row
execute function public.set_updated_at();

drop trigger if exists ai_command_actions_sync_scope on public.ai_command_actions;
create trigger ai_command_actions_sync_scope
before insert or update on public.ai_command_actions
for each row
execute function public.sync_ai_action_scope_from_run();

alter table public.ai_command_runs enable row level security;
alter table public.ai_command_actions enable row level security;

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

grant select, insert, update on public.ai_command_runs to authenticated;
grant select, insert, update on public.ai_command_actions to authenticated;

create or replace function public.archive_product_and_remove_inventory_graphql(target_product_id uuid)
returns boolean
language sql
volatile
security invoker
as $$
  select public.archive_product_and_remove_inventory(target_product_id);
$$;

grant execute on function public.archive_product_and_remove_inventory_graphql(uuid) to authenticated;
