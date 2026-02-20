# StoreSync

This frontend now uses:
- Supabase Auth for login/session
- Supabase `pg_graphql` endpoint for table CRUD
- Supabase SQL RPC for atomic inventory/order and product archive workflows
- React Query for caching and mutation invalidation

## 1) Prerequisites

- Node.js or Bun
- A Supabase project
- GraphQL extension enabled (`pg_graphql`)

## 2) Configure environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3) Apply database schema

Run the SQL in:

- `supabase/migrations/20260220011000_init_inventory_graphql.sql`
- `supabase/migrations/20260220130000_orders_transfer_graphql.sql`
- `supabase/migrations/20260220142000_graphql_order_function_wrappers.sql`
- `supabase/migrations/20260220160000_product_threshold_model.sql`
- `supabase/migrations/20260220190000_workspace_multi_tenancy.sql`

Then seed data (optional):

- `supabase/seed.sql`

Notes:
- Seed profile/settings for `arjun@storesync.in` only works if that auth user already exists.
- Schema creates required tables: `profiles`, `user_settings`, `products`, `locations`, `inventory_items`, `orders`.

## 4) Run locally

```bash
bun install
bun run dev
```

Open:
- `http://localhost:5173`

## 5) Auth + route behavior

- Public routes: `/`, `/login`
- Protected routes: `/dashboard`, `/inventory`, `/orders`, `/products`, `/locations`, `/settings`
- Login uses Supabase email/password.

## 6) CRUD coverage

- Products: create/update/archive
- Locations: create/update
- Inventory: create/update
- Orders: create via atomic RPC (`create_order_and_apply_inventory`)
- Settings: profile + user settings persist to DB
- Inventory supports query params:
  - `/inventory?location=<locationId>`
  - `/inventory?product=<productId>`

## 7) Validation commands

```bash
bun run test
bun run build
```
