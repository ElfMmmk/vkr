# Graphic Designer Portfolio

Full-stack VKR demo application for a graphic designer portfolio, content management, and order request handling.

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

The public site works with built-in demo content even before Supabase is configured. Admin login and real content mutations require Supabase environment variables and a Supabase Auth user whose email equals `ADMIN_EMAIL`.

## Supabase

The target demo setup uses Supabase Free plan: 500 MB database, 1 GB file storage, 5 GB egress, and up to 2 active free projects. Free projects can pause after 1 week of inactivity, so open the Supabase dashboard before a demo if the project has been idle.

1. Create a Supabase project named `vkr-portfolio` on Free plan in `Europe / Central EU (Frankfurt)`.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Create a public Storage bucket named `portfolio-images`.
5. Create one Auth user for `ADMIN_EMAIL`.
6. Copy the project URL, publishable key, and secret key into `.env.local` and later into Vercel environment variables.

For uploaded portfolio images, the app keeps a server-side 10 MB limit and accepts JPEG, PNG, WebP, GIF, and AVIF. Do not enable paid Storage Image Transformations for the Free plan demo.

Legacy Supabase key names are still supported as fallback: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Prefer the newer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.

The SQL patch `supabase/patch-2026-05-11-ui-security-code-audit.sql` has been applied to the hosted `vkr-portfolio` Supabase project on 2026-05-12.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

`test:e2e` starts the local dev server automatically.
