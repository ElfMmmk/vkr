# Graphic Designer Portfolio

Full-stack VKR demo application for a graphic designer portfolio, content management, order placement with preliminary pricing, and manager-side contract-order handling.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Postgres, Auth, and Storage
- Vercel deployment

## Local start

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=
```

Run the app:

```bash
npm run dev
```

The public site works with built-in demo content even before Supabase is configured. Admin login and real content mutations require Supabase environment variables, a Supabase Auth user, and an explicit `profiles.role = 'admin'` or `profiles.role = 'manager'` record.

## Order workflow

Clients can choose a service package, optional add-ons, a portfolio example as a visual reference, expected result, materials, and desired deadline. The order form shows preliminary price and timing before submission. Managers and admins process orders in `/admin/requests`, prepare an in-system contract-order with final price, scope, and deadline, and clients can accept that contract-order from `/account`. Online payment and legal e-signature are not implemented.

Real order persistence is server-only: the public form posts to a Next.js server action, and the action saves the recalculated order snapshot through `SUPABASE_SECRET_KEY`. Direct `anon` or `authenticated` inserts into `public.requests` through the Supabase Data API are intentionally rejected by RLS/grants.

## Supabase

The target demo setup uses Supabase Free plan: 500 MB database, 1 GB file storage, 5 GB egress, and up to 2 active free projects. Free projects can pause after 1 week of inactivity, so open the Supabase dashboard before a demo if the project has been idle.

1. Create a Supabase project named `vkr-portfolio` on Free plan in `Europe / Central EU (Frankfurt)`.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`; it creates demo pages, services, portfolio projects, service packages, and add-ons.
4. Verify that the public Storage bucket `portfolio-images` exists. `schema.sql` creates or updates it with a 10 MB file limit.
5. Create one Auth user for `ADMIN_EMAIL` and set this user's row in `public.profiles` to `role = 'admin'`.
6. Copy the project URL, publishable key, and secret key into `.env.local` and later into Vercel environment variables.

For uploaded portfolio images, the app keeps a server-side 10 MB limit and accepts JPEG, PNG, WebP, GIF, and AVIF. Do not enable paid Storage Image Transformations for the Free plan demo.

Legacy Supabase key names are still supported as fallback: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Prefer the newer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.

The hosted `vkr-portfolio` Supabase project was updated with the media/security audit changes on 2026-05-12 and the technical audit upload/RLS fixes on 2026-05-14. New projects should use the current `supabase/schema.sql` plus `supabase/seed.sql`; the schema contains order snapshots, contract-orders, RLS, grants, and Storage settings, while the seed file contains demo service packages and add-ons.

The application keeps generated-style Supabase Database types in `src/lib/supabase/database.types.ts`. Update this file when `supabase/schema.sql` changes.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

`test:e2e` starts the local dev server automatically.

Optional live Supabase checks are skipped by default and write only temporary data with cleanup:

```powershell
$env:SUPABASE_RLS_SMOKE='1'
npm run test -- tests/supabase-rls-smoke.test.ts

$env:PLAYWRIGHT_SUPABASE_E2E='1'
$env:PLAYWRIGHT_PORT='3003'
npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line
```

They require `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

File cleanup notes are tracked in `FILE-CLEANUP-AUDIT.md`.
