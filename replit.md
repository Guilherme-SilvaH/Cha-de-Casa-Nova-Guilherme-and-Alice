# Chá de Casa Nova — Guilherme & Alice

Site de lista de presentes para o chá de casa nova, com convite público e gerenciamento administrativo conectado ao Supabase.

## Run & Operate

- `pnpm --filter @workspace/casa-nova-lista run dev` — run the website
- `pnpm --filter @workspace/casa-nova-lista run typecheck` — typecheck the website
- `pnpm --filter @workspace/casa-nova-lista run build` — build the website
- Supabase schema, RLS, first-admin setup, and required environment variables: `artifacts/casa-nova-lista/SUPABASE_SETUP.md`
- Required environment: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React, Vite, Tailwind CSS, Wouter, TanStack Query
- Persistence, email/password authentication, and image storage: Supabase
- Browser uses only the public Supabase anon key; row-level security restricts administration

## Where things live

- `artifacts/casa-nova-lista/src/App.tsx` — public invitation and admin interface
- `artifacts/casa-nova-lista/src/lib/housewarming-api.ts` — Supabase queries, mutations, and React Query hooks
- `artifacts/casa-nova-lista/src/lib/housewarming-types.ts` — gift and settings types
- `artifacts/casa-nova-lista/supabase/setup.sql` — tables, RPC, storage bucket, and RLS policies
- `artifacts/casa-nova-lista/SUPABASE_SETUP.md` — Supabase setup and first-admin guide

## Architecture decisions

- Public settings use a safe RPC so a hidden delivery address is not exposed in the browser response.
- Fulfilled gifts remain in Supabase and the admin panel; public queries only include available gifts.
- Admin access is controlled by the `public.admin_users` email allowlist and Supabase RLS.

## Product

- Public invite with searchable/filterable gifts, secure external HTTPS purchase links, guest-reported purchased status, delivery details, and a copyable Pix key.
- Admin login with gift management, purchase-link editing, available/purchased filters, status correction, ordering, summary counts, and editable site settings.
- This is exclusively a housewarming list, not a wedding site. Do not add checkout or claim that the site verifies a store payment. Guest purchase reports are atomic declarations; only administrators can restore availability.
- Track whether a purchased status came from a guest report so hosts can distinguish it from a manual correction; do not collect guest identity.
- The requested delivery address is configured by `supabase/setup.sql` when the database address is blank, and remains editable/controllable through the existing public-address setting. Do not invent a complement, neighborhood, or reference.

## User preferences

- Keep the site simple and functional; do not add checkout, reservations, payment processing, or store integrations.

## Gotchas

- Run `supabase/setup.sql` in the connected Supabase project's SQL Editor after schema changes; it preserves existing gifts, converts `fulfilled` statuses to `purchased`, and installs the atomic public purchase function. Add each administrator to `public.admin_users` before using `/admin`.
- Do not put a Supabase `service_role` key in this frontend.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
