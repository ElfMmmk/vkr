# Build a deployable graphic designer portfolio app

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository contains `PLANS.md` at the repository root. This document is maintained according to that file.

## Purpose / Big Picture

The result of this work is a full-stack web application for a graphic designer. A visitor can open a public site, browse portfolio projects and services, filter projects, inspect a case study, and submit an order request. The designer can sign in to a private admin panel, edit page text, projects, services, tags, image metadata, and request statuses without changing code.

The finished app is intended for a VKR demonstration and production-like deployment. It will run locally for development and can be deployed from GitHub to Vercel, with Supabase providing the database, image storage, and administrator authentication.

## Progress

- [x] (2026-05-10 19:45Z) Confirmed repository is effectively empty except `AGENTS.md`, `PLANS.md`, and IDE folders.
- [x] (2026-05-10 19:45Z) Chosen stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Vercel.
- [x] (2026-05-10 19:45Z) Created this ExecPlan before implementation.
- [x] (2026-05-10 20:05Z) Scaffolded the Next.js project structure, package scripts, Tailwind, ESLint, Vitest, Playwright, and app configuration.
- [x] (2026-05-10 20:08Z) Added Supabase schema, seed data, storage setup notes, `.env.example`, and README setup instructions.
- [x] (2026-05-10 20:15Z) Implemented shared data access, validation, auth helpers, demo fallback data, order submission action, and admin mutation actions.
- [x] (2026-05-10 20:20Z) Implemented public routes for home, about, portfolio, project detail, services, contacts, order, and success pages.
- [x] (2026-05-10 20:25Z) Implemented protected admin routes for dashboard, projects, services, tags, images, requests, page text, and login.
- [x] (2026-05-10 20:28Z) Added Vitest unit tests for validation, status checks, slug creation, and filtering; added Playwright scenarios for public browsing and setup-state login.
- [x] (2026-05-10 20:34Z) Ran typecheck, lint, unit tests, production build, e2e tests, and Playwright screenshot verification.

## Surprises & Discoveries

- Observation: The repository has no existing application code, package manifest, or framework constraints.
  Evidence: `rg --files` returned only `AGENTS.md` and `PLANS.md`; `git status --short` showed only untracked IDE folders and these documents.

- Observation: The local Node version is `20.17.0`, while some latest lint dependency packages prefer Node `20.19+`.
  Evidence: `npm install` emitted an `EBADENGINE` warning for `eslint-visitor-keys@5.0.1`, but `npm run lint` still passed.

- Observation: Vitest 4 failed to start in this environment because of an ESM/CJS loader issue under Node `20.17.0`.
  Evidence: `npm run test` reported `Error [ERR_REQUIRE_ESM]: require() of ES Module ... std-env ... not supported`.

- Observation: Playwright needed its Chromium browser installed after package installation.
  Evidence: the first `npm run test:e2e` failed with `Executable doesn't exist ... please run npx playwright install`; after `npx playwright install chromium`, e2e tests passed.

- Observation: One initial external Unsplash URL returned 404 during browser verification.
  Evidence: Playwright dev server logs showed `upstream image response failed ... 404`; the hero project image was replaced with a local generated bitmap asset at `public/assets/botanica-lab-cover.png`.

- Observation: Production dependency audit can be kept clean by overriding transitive PostCSS to the patched version.
  Evidence: `npm audit --omit=dev` first reported a moderate PostCSS advisory through Next.js; after setting a PostCSS override to `^8.5.14`, `npm audit --omit=dev` reported `found 0 vulnerabilities`.

## Decision Log

- Decision: Use Next.js App Router with TypeScript and Tailwind CSS.
  Rationale: It provides public pages, protected admin pages, server actions, route handlers, and straightforward Vercel deployment in one application.
  Date/Author: 2026-05-10 / Codex.

- Decision: Use Supabase for Postgres, Storage, and email/password administrator authentication.
  Rationale: The app needs persistent records, image uploads, auth, and a demo-friendly hosted backend without building a separate server deployment.
  Date/Author: 2026-05-10 / Codex.

- Decision: Keep the first version to one personal administrator identified by `ADMIN_EMAIL`.
  Rationale: The requirements explicitly exclude a multi-role corporate admin model; an email allowlist is simpler and sufficient for VKR demonstration.
  Date/Author: 2026-05-10 / Codex.

- Decision: Implement a realistic demo fallback dataset in code in addition to Supabase-backed data access.
  Rationale: The public site should remain demonstrable before the user creates a Supabase project, while production data will come from Supabase when environment variables are configured.
  Date/Author: 2026-05-10 / Codex.

- Decision: Pin Vitest to the 2.x line instead of 4.x.
  Rationale: Vitest 4 did not run on the local Node `20.17.0`; Vitest 2.1.9 runs the current unit suite successfully and keeps the test command usable for the VKR environment.
  Date/Author: 2026-05-10 / Codex.

- Decision: Use a generated local bitmap asset for the primary Botanica Lab cover.
  Rationale: A local project asset avoids remote image 404s and gives the first viewport a more realistic portfolio presentation.
  Date/Author: 2026-05-10 / Codex.

- Decision: Add an npm override for `postcss`.
  Rationale: The latest available Next.js version still resolved a vulnerable transitive PostCSS package in audit output; the override keeps production audit clean while preserving a successful build.
  Date/Author: 2026-05-10 / Codex.

## Outcomes & Retrospective

Implemented a deployable Next.js/Supabase portfolio application with public pages, order submission, protected admin routes, Supabase schema/seed files, setup documentation, unit tests, e2e tests, and a local generated portfolio image. The app renders demo content without Supabase so it can be shown immediately, while real admin login and persistence are enabled by configuring Supabase environment variables and creating the personal admin user.

All local verification commands passed after dependency setup:

    npm run typecheck
    npm run lint
    npm run test
    npm run build
    npm run test:e2e
    npm audit --omit=dev

Remaining deployment work is operational rather than code-level: create the Supabase project, run the SQL files, create the `portfolio-images` bucket, create the Auth user matching `ADMIN_EMAIL`, set Vercel environment variables, and deploy from GitHub.

Full `npm audit` still reports dev-only moderate advisories through Vitest 2/Vite/esbuild. Vitest 4 is the audit-suggested line but did not run on the local Node `20.17.0`; upgrading local Node to `20.19+` would allow revisiting that dev-tooling upgrade.

## Context and Orientation

The repository root is `C:\Users\forma\Desktop\vkr\code`. At the start of this plan it contains no Next.js app. The implementation will create a standard source-directory Next.js project, with route files under `src/app`, shared components under `src/components`, library code under `src/lib`, tests under `tests`, and database setup under `supabase`.

Next.js App Router means that page routes are created by folders containing `page.tsx` files. A Server Component is a React component rendered on the server by default. A Server Action is a server-only function marked with `'use server'` and used for form submissions and mutations. Supabase is the hosted backend service that provides the Postgres database, authentication, and file storage bucket.

The app has two visible surfaces. The public surface uses routes such as `/portfolio` and `/order`. The private surface uses routes under `/admin` and must require a signed-in user whose email equals `ADMIN_EMAIL`.

## Plan of Work

First, create the project scaffold: `package.json`, TypeScript, Next.js, Tailwind, ESLint, Vitest, Playwright, and core app files. Use stable component boundaries instead of one monolithic page.

Second, define the data model in `supabase/schema.sql`, including tables for pages, services, tags, projects, project relations, images, and requests. Add seed content in `supabase/seed.sql`. Include indexes for public filtering and admin request lookup. Add a storage bucket note and environment example.

Third, implement shared TypeScript types, demo data, Supabase client factories, validation schemas, slug helpers, request status helpers, and repository-style data functions. Supabase clients must be initialized lazily inside functions so builds do not crash when environment variables are absent.

Fourth, build the public site. It must include home, about, portfolio list with service/tag filtering, project detail pages, services, contacts, order form, and success page. Public data reads must return only published or active records. The visual style must be minimal editorial: light background, strong typography, large imagery, restrained accent color, predictable navigation, and responsive layouts.

Fifth, build the admin panel. It must include login, dashboard, and management pages for projects, services, tags, images, requests, and page text. Admin mutations must verify the signed-in user on the server before changing data. The UI should be utilitarian: tables, compact forms, status controls, search, sorting, and clear success/error messages.

Sixth, add tests and checks. Unit tests should cover validation, slug generation, request statuses, and public filtering. Browser scenarios should cover the core public and admin flows as far as possible without requiring real hosted credentials.

## Concrete Steps

Run commands from `C:\Users\forma\Desktop\vkr\code`.

Create files with the Next.js project structure. Then install dependencies with:

    npm install

Run the development server with:

    npm run dev

If Supabase environment variables are absent, the public site renders demo content. Admin login shows a clear setup message, and protected admin pages require Supabase Auth with the configured `ADMIN_EMAIL`.

After creating a Supabase project, apply schema and seed files in the Supabase SQL editor or with Supabase CLI. Configure these environment variables locally and in Vercel:

    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY
    ADMIN_EMAIL

Create one Supabase Auth user with the same email as `ADMIN_EMAIL`.

## Validation and Acceptance

Run:

    npm run typecheck
    npm run lint
    npm run test

Expected result: all commands complete successfully. The unit tests should prove that invalid order submissions are rejected, request statuses are constrained to the allowed set, slugs are stable, and unpublished records are not returned by public filters.

Start the app with:

    npm run dev

Open `http://localhost:3000`. A visitor should see the home page with designer positioning, navigation, portfolio CTA, and order CTA. Opening `/portfolio` should show project cards and filtering controls. Opening a project detail page should show image-led case content and a link to `/order`. Submitting a valid order should navigate to `/order/success` or display a success state.

Open `http://localhost:3000/admin/login`. Without a session, admin routes must redirect to login or show login UI. After signing in with the personal Supabase admin account, `/admin` should show dashboard links and counts. Admin list pages should allow creating, editing, deleting, searching, sorting, or changing statuses according to the entity.

After deployment to Vercel, repeat the same public and admin flows on the deployed URL and confirm data persists in Supabase.

The local implementation was verified with the following successful commands:

    npm run typecheck
    npm run lint
    npm run test
    npm run build
    npm run test:e2e
    npm audit --omit=dev

## Idempotence and Recovery

The schema uses `create table if not exists` where practical and seed inserts use stable slugs or keys so reruns can be made safe. If local dependency installation fails due to network restrictions, retry after approving network access or run `npm install` manually. If Supabase variables are missing, the app must keep public demo pages usable and make backend setup gaps visible in admin/mutation paths.

Avoid deleting user or IDE files. Existing untracked `.idea` and `.vs` folders are unrelated and should not be changed.

## Artifacts and Notes

Initial repository evidence:

    rg --files
    AGENTS.md
    PLANS.md

    git status --short
    ?? .idea/
    ?? .vs/
    ?? AGENTS.md
    ?? PLANS.md

Final verification evidence:

    npm run test
    Test Files 1 passed
    Tests 5 passed

    npm run test:e2e
    2 passed

    npm run build
    Compiled successfully
    Generated static pages: 21/21

    npm audit --omit=dev
    found 0 vulnerabilities

## Interfaces and Dependencies

Use these dependencies:

- `next`, `react`, `react-dom` for the application framework.
- `typescript`, `eslint`, `tailwindcss`, `postcss`, `autoprefixer` for build and styling.
- `@supabase/supabase-js` and `@supabase/ssr` for database, auth, and storage access.
- `zod` for input validation.
- `lucide-react` for consistent UI icons.
- `vitest` for unit tests.
- `@playwright/test` for browser scenarios.

Public route files must exist under `src/app`: `/`, `/about`, `/portfolio`, `/portfolio/[slug]`, `/services`, `/contacts`, `/order`, and `/order/success`.

Admin route files must exist under `src/app/admin`: `/login`, dashboard index, `/projects`, `/services`, `/tags`, `/images`, `/requests`, and `/pages`.

The request status type must be exactly:

    'new' | 'in_progress' | 'approved' | 'completed' | 'rejected'

Required environment variables are:

    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY
    ADMIN_EMAIL

Revision note: Created the initial ExecPlan before implementation to satisfy repository requirements for complex features.

Revision note: Updated after implementation to record completed milestones, verification results, environment discoveries, and deployment follow-up steps.
