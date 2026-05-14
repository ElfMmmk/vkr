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
4. Verify that the public Storage bucket named `portfolio-images` exists. `schema.sql` creates or updates it.
5. In Authentication, create one email/password user whose email is `formaxmos@gmail.com`.
6. Copy project URL, publishable key, and secret key into `.env.local` and later into Vercel environment variables.

The hosted `vkr-portfolio` Supabase project was updated with the media/security audit changes on 2026-05-12 and the technical audit upload/RLS fixes on 2026-05-14. New projects should use the current `supabase/schema.sql` plus `supabase/seed.sql`. The schema includes reusable project media, featured project ordering, request throttling metadata, server-only request persistence grants, limited profile updates, order snapshots, contract-orders, and reproducible `portfolio-images` bucket settings. The seed file creates demo service packages and service add-ons after the demo services exist.

The order workflow uses `service_packages` and `service_addons` for admin-managed preliminary pricing, stores the submitted calculation snapshot in `requests`, and stores manager-confirmed final terms in `order_contracts`. `order_contracts` are visible to authenticated clients only when the linked request belongs to them and the contract is sent or accepted. Order insertion is server-only: the public form posts to a Next.js server action, and that action saves through `SUPABASE_SECRET_KEY`; direct public Data API inserts into `requests` are rejected.

Use these preferred variable names:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=formaxmos@gmail.com
```

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names are still supported as fallback. The app uses the secret key only in server-side code. Do not expose it in browser code or commit real credentials.

Create `portfolio-images` as a public bucket for demo portfolio media. The app enforces a 10 MB per-image upload limit and accepts JPEG, PNG, WebP, GIF, and AVIF. Do not enable paid Storage Image Transformations for the Free plan demo.

Optional live checks are available after `.env.local` is configured:

```powershell
$env:SUPABASE_RLS_SMOKE='1'
npm run test -- tests/supabase-rls-smoke.test.ts

$env:PLAYWRIGHT_SUPABASE_E2E='1'
$env:PLAYWRIGHT_PORT='3003'
npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line
```

Both checks create temporary users/data and clean them up automatically.
