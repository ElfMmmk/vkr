# Supabase setup

Target setup for the VKR demo:

- Supabase plan: Free.
- Region: Europe / Central EU (Frankfurt).
- Project name: `vkr-portfolio`.
- Admin email: `formaxmos@gmail.com`.

Free plan limits to keep in mind: 500 MB database, 1 GB file storage, 5 GB egress, and project pause after 1 week of inactivity.

1. Create a Supabase project using the settings above.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Run `supabase/seed.sql` for demo content, including service packages and add-ons.
4. Verify that the public Storage bucket named `portfolio-images` and the private Storage bucket named `order-attachments` exist. `schema.sql` creates or updates both.
5. In Authentication, create one email/password user whose email is `formaxmos@gmail.com`.
6. Copy project URL, publishable key, and secret key into `.env.local` and later into Vercel environment variables.

The hosted `vkr-portfolio` Supabase project was updated with the media/security audit changes on 2026-05-12 and the technical audit upload/RLS fixes on 2026-05-14. New projects should use the current `supabase/schema.sql` plus `supabase/seed.sql`. The schema includes reusable project media, featured project ordering, request throttling metadata, server-only request persistence grants, limited profile updates, order snapshots, contract-orders, private order attachments, guest claim tokens, and reproducible `portfolio-images` / `order-attachments` bucket settings. The seed file creates demo service packages and service add-ons after the demo services exist.

The order workflow uses `service_packages` and `service_addons` for admin-managed preliminary pricing, stores the submitted calculation snapshot in `requests`, and stores manager-confirmed final terms in `order_contracts`. Private client materials use `order_attachments` plus the private `order-attachments` bucket; uploads are written by server-side service-role code and read by clients/managers through server-created signed URLs. Guest request ownership uses `request_claim_tokens`; only token hashes are stored, tokens are single-use, and they expire after 24 hours. `order_contracts` and `order_attachments` are visible to authenticated clients only when the linked request belongs to them. Order insertion is server-only: the public form posts to a Next.js server action, and that action saves through `SUPABASE_SECRET_KEY`; direct public Data API inserts into `requests` are rejected.

For an existing hosted project, run these migrations in order before live smoke checks:

```text
supabase/migrations/20260605000000_analytics_events.sql
supabase/migrations/20260606000000_order_attachments_and_claim_tokens.sql
```

Analytics V2 uses `public.analytics_events` for public `page_view` and explicit `cta_click` events. Browser code posts to `/api/analytics`; the route validates the payload, creates a daily `source_hash`, and writes through the server-side secret/service-role client. The table has RLS enabled, no `anon`/`authenticated` grants, and explicit `service_role` privileges. For an existing hosted project, run `supabase/migrations/20260605000000_analytics_events.sql` in the Supabase SQL Editor before expecting traffic metrics or the live admin analytics e2e test to work.

Use these preferred variable names:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=formaxmos@gmail.com
```

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names are still supported as fallback. The app uses the secret key only in server-side code. Do not expose it in browser code or commit real credentials.

Create `portfolio-images` as a public bucket for demo portfolio media. The app enforces a 10 MB per-image upload limit and accepts JPEG, PNG, WebP, GIF, and AVIF. Create `order-attachments` as a private bucket for client materials. It has a 10 MB per-file bucket limit and accepts PDF, JPEG, PNG, WebP, DOC, DOCX, and TXT. Do not enable paid Storage Image Transformations for the Free plan demo.

Optional live checks are available after `.env.local` is configured:

```powershell
$env:SUPABASE_RLS_SMOKE='1'
npm run test -- tests/supabase-rls-smoke.test.ts

$env:PLAYWRIGHT_SUPABASE_E2E='1'
$env:PLAYWRIGHT_PORT='3003'
npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line
```

The live admin e2e check also verifies analytics DB writes, client attachment upload/manager visibility, and single-use claim tokens. Both checks create temporary users/data and clean them up automatically, including private Storage objects.
