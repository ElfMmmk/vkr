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

### Auth email and live registration demo

Supabase's built-in Auth email sender is intentionally limited and is not reliable for a defense/demo where several new client accounts may be registered. For the live registration scenario on `/account/register`, configure Custom SMTP in Supabase before the demo. This is compatible with the Supabase Free plan; email volume limits then depend mostly on the selected SMTP provider and Supabase Auth rate-limit settings.

The no-domain demo path uses SMTP2GO Free with a verified single sender email. In SMTP2GO, open Sending -> Verified Senders -> Single sender emails, add the sender email, confirm it from the mailbox, then open Sending -> SMTP Users and copy the SMTP username and password. In Supabase Dashboard, open Authentication -> Settings -> SMTP, enable Custom SMTP, and use:

```text
Host: mail.smtp2go.com
Port: 587
Username: SMTP username from SMTP2GO
Password: SMTP password from SMTP2GO
Sender email: verified single sender email
Sender name: Graphic Designer Portfolio
```

If the mailbox domain has strict DMARC and SMTP2GO refuses single sender verification, use a verified sender domain instead or temporarily disable email confirmation only for the defense demo.

Before the defense, register a fresh client email through `/account/register`, confirm that the email arrives, follow the confirmation link if email confirmation is enabled, sign in through `/account/login`, and place one test order. Keep a fallback client demo email and password outside Git, for example in a local password manager or private demo notes. Do not commit demo passwords to `.env.local`, README, seed files, or tests.

## Vercel deployment

Deploy only after live registration works through Custom SMTP. A `*.vercel.app` URL is used as the public site URL and Supabase redirect URL, not as an email sender domain.

For a production Vercel deployment, set these environment variables in Vercel Project Settings -> Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
ADMIN_EMAIL
```

After deployment, update Supabase Authentication -> URL Configuration:

```text
Site URL: https://your-vercel-project.vercel.app
Redirect URLs:
https://your-vercel-project.vercel.app/**
http://localhost:3000/**
```

Then repeat the live flow on the Vercel URL: registration, email confirmation, login, order placement, manager contract-order, and client acceptance.

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

The live admin e2e suite also verifies that browser `fetch(..., keepalive)` calls to
`/api/analytics` persist `page_view` and `cta_click` rows in `analytics_events`, then removes
the temporary smoke rows.

They require `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

File cleanup notes are tracked in `FILE-CLEANUP-AUDIT.md`.
