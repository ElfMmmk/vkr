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
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
```

Run the app:

```bash
npm run dev
```

The public site works with built-in demo content even before Supabase is configured. Admin login and real content mutations require Supabase environment variables and a Supabase Auth user whose email equals `ADMIN_EMAIL`.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Create a public Storage bucket named `portfolio-images`.
5. Create one Auth user for the administrator.
6. Add environment variables locally and in Vercel.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

`test:e2e` starts the local dev server automatically.
