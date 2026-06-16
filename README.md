# Graphic Designer Portfolio

Full-stack VKR demo application for a graphic designer portfolio, content management, order placement with preliminary pricing, and manager-side contract-order handling.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Postgres, Auth, and Storage

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

Clients move through a step-by-step `/order` wizard: service, package, add-ons/reference, brief, contacts, and review. The form keeps a sticky estimate summary, saves a versioned local draft in `localStorage`, supports quick brief chips, can recommend a starting service/package through a local no-AI quiz, and stores a safe success-page snapshot in browser storage. Managers and admins process orders in `/admin/requests`, prepare an in-system contract-order with final price, scope, and deadline, and clients accept that contract-order from `/account/requests/[id]`.

Private client materials use the `order-attachments` Supabase Storage bucket plus `public.order_attachments` metadata rows. Uploads are limited to 5 files per request, 10 MB each, and PDF/JPEG/PNG/WebP/DOC/DOCX/TXT. The public `portfolio-images` bucket is not used for client materials. Guest orders receive a 24-hour one-time claim token on the success page; after login or registration, the token links the request to the client account without matching by email or phone.

Real order persistence is server-only: the public form posts to a Next.js server action, and the action saves the recalculated order snapshot through `SUPABASE_SECRET_KEY`. Direct `anon` or `authenticated` inserts into `public.requests` through the Supabase Data API are intentionally rejected by RLS/grants.

## Supabase

The target demo setup uses Supabase Free plan: 500 MB database, 1 GB file storage, 5 GB egress, and up to 2 active free projects. Free projects can pause after 1 week of inactivity, so open the Supabase dashboard before a demo if the project has been idle.

1. Create a Supabase project on Free plan in `Europe / Central EU (Frankfurt)`.
2. Run `supabase/schema.sql` for the base database structure.
3. Run the SQL files in `supabase/migrations/` in chronological order when applying incremental changes.
4. Verify that the public Storage bucket `portfolio-images` and private Storage bucket `order-attachments` exist. `schema.sql` creates or updates both with 10 MB file limits.
5. Create one Auth user for `ADMIN_EMAIL` and set this user's row in `public.profiles` to `role = 'admin'`.
6. Copy the project URL, publishable key, and secret key into `.env.local`.

### Auth registration modes

For registration without an email delivery service, open Supabase Dashboard -> Authentication -> Sign In / Providers and disable `Confirm email`. In this mode `/account/register` creates the account, signs the client in immediately, and redirects to the personal account. This is the configured mode for the project and does not require SMTP.

If email ownership confirmation is required later, enable `Confirm email` and configure Custom SMTP first. Supabase's built-in Auth email sender is intentionally limited and is not reliable when several new client accounts are registered. Custom SMTP is compatible with the Supabase Free plan; email volume limits then depend mostly on the selected SMTP provider and Supabase Auth rate-limit settings.

The no-domain demo path uses SMTP2GO Free with a verified single sender email. In SMTP2GO, open Sending -> Verified Senders -> Single sender emails, add the sender email, confirm it from the mailbox, then open Sending -> SMTP Users and copy the SMTP username and password. In Supabase Dashboard, open Authentication -> Settings -> SMTP, enable Custom SMTP, and use:

```text
Host: mail.smtp2go.com
Port: 587
Username: SMTP username from SMTP2GO
Password: SMTP password from SMTP2GO
Sender email: verified single sender email
Sender name: Graphic Designer Portfolio
```

If the mailbox domain has strict DMARC and SMTP2GO refuses single sender verification, use a verified sender domain instead.

Before the defense, register a fresh client email through `/account/register`. With `Confirm email` disabled, verify that the site immediately opens `/account`; with confirmation enabled, verify delivery and follow the email link before signing in. Then place one test order. Keep a fallback client demo email and password outside Git, for example in a local password manager or private demo notes. Do not commit demo passwords to `.env.local`, README, seed files, or tests.

For uploaded portfolio images, the app keeps a server-side 10 MB limit and accepts JPEG, PNG, WebP, GIF, and AVIF. Do not enable paid Storage Image Transformations for the Free plan demo.

Legacy Supabase key names are still supported as fallback: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Prefer the newer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.

New projects should use the current `supabase/schema.sql` plus the incremental SQL files in `supabase/migrations/`. Demo content is available from the local fallback data in `src/lib/demo-data.ts` and can be replaced through the admin interface.

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

The live admin e2e suite also verifies that browser `fetch(..., keepalive)` calls to
`/api/analytics` persist `page_view` and `cta_click` rows in `analytics_events`, that client
order attachments are visible to managers, and that guest claim tokens are single-use. It removes
temporary smoke rows and private Storage objects during cleanup.

They require `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
