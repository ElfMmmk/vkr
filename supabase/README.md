# Supabase setup

This directory keeps public database setup files that are safe to store in the repository:

- `schema.sql` contains the reproducible database structure, RLS policies, grants, indexes, and Storage bucket settings.
- `migrations/` contains incremental SQL changes that should be applied in chronological order.

Personal demo data, production data exports, real user records, access keys, and one-off SQL dumps must not be committed. Keep them in local notes or private operational storage.

## Environment

Use these variable names in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=
```

Legacy names are still supported as fallback by the application code:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The secret key is used only by server-side code. Do not expose it in browser code and do not commit real values.

## Database Setup

For a fresh database:

1. Run `supabase/schema.sql`.
2. Run every file in `supabase/migrations/` in filename order.
3. Verify that the public `portfolio-images` bucket and private `order-attachments` bucket exist.
4. Create an Auth user for the admin account and set the corresponding `public.profiles.role` value to `admin`.

The application can run public pages with local fallback data from `src/lib/demo-data.ts`. Real content for pages, services, projects, packages, add-ons, and images can be managed through the admin interface after Supabase is configured.

## Implemented Data Areas

- Public content: pages, services, service packages, add-ons, tags, projects, project images, and translations.
- Order flow: requests, request status history, contract-orders, private order attachments, and one-time guest claim tokens.
- Account area: client-owned request visibility, contract acceptance, and private material upload.
- Admin area: content management, request management, user roles, notifications, image storage, and XLSX request export.
- Analytics: private `analytics_events` table written by the server-side `/api/analytics` route.

## Live Checks

Optional live checks are skipped by default and require local environment variables:

```powershell
$env:SUPABASE_RLS_SMOKE='1'
npm run test -- tests/supabase-rls-smoke.test.ts

$env:PLAYWRIGHT_SUPABASE_E2E='1'
$env:PLAYWRIGHT_PORT='3003'
npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line
```

The live checks create temporary users and rows with test prefixes and clean them up automatically, including private Storage objects.
