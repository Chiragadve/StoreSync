-- Assistant diagnostics (read-only)
-- Run in Supabase SQL editor to verify assistant runtime dependencies.

select now() as checked_at_utc;

-- Current auth/workspace context (when run as authenticated JWT context)
select auth.uid() as auth_user_id, public.current_workspace_id() as current_workspace_id;

-- Table existence
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('ai_command_runs', 'ai_command_actions', 'workspaces', 'workspace_members')
order by table_name;

-- Function existence
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'current_workspace_id',
    'create_order_and_apply_inventory_graphql',
    'create_transfer_order_and_move_inventory_graphql',
    'archive_product_and_remove_inventory_graphql'
  )
order by p.proname;

-- RLS enabled
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('ai_command_runs', 'ai_command_actions')
order by tablename;

-- Policies
select
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
from pg_policies
where schemaname = 'public'
  and tablename in ('ai_command_runs', 'ai_command_actions')
order by tablename, policyname;

-- Table grants to authenticated
select
  table_schema,
  table_name,
  privilege_type,
  grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('ai_command_runs', 'ai_command_actions')
  and grantee = 'authenticated'
order by table_name, privilege_type;

-- Routine execute grants to authenticated
select
  routine_schema,
  routine_name,
  privilege_type,
  grantee
from information_schema.role_routine_grants
where routine_schema = 'public'
  and routine_name in (
    'current_workspace_id',
    'create_order_and_apply_inventory_graphql',
    'create_transfer_order_and_move_inventory_graphql',
    'archive_product_and_remove_inventory_graphql'
  )
  and grantee = 'authenticated'
order by routine_name;

-- Workspace membership snapshot
select workspace_id, user_id, role, created_at
from public.workspace_members
order by created_at desc
limit 25;

-- Recent assistant runs/actions
select id, user_id, workspace_id, status, model, created_at
from public.ai_command_runs
order by created_at desc
limit 25;

select id, run_id, kind, status, error, created_at
from public.ai_command_actions
order by created_at desc
limit 25;
