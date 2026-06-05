# Project Structure

Этот файл - навигационная карта проекта для быстрых правок и проверок. Его нужно обновлять после каждого изменения, которое добавляет или переносит маршруты, server actions, data-layer, Supabase schema/seed, тесты, крупные компоненты или важные правила работы.

## Stack

- Next.js App Router, React, TypeScript.
- Tailwind CSS для интерфейса.
- Supabase Postgres, Auth и Storage.
- Vitest для unit/integration-проверок.
- Playwright для e2e/browser smoke.

## Root Files

- `README.md` - запуск, Supabase setup, SMTP, Vercel и команды проверок.
- `PROJECT_STRUCTURE.md` - карта проекта; обновлять вместе со структурными изменениями.
- `supabase/schema.sql` - текущая схема БД, RLS, grants, Storage bucket.
- `supabase/seed.sql` - демо-контент для страниц, услуг, проектов, пакетов и доплат.
- `supabase/migrations/20260605000000_analytics_events.sql` - ручная migration для событий `page_view` и `cta_click`.
- `package.json` - npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- `playwright.config.ts` - e2e webServer и Supabase e2e flags.

## App Router

Public routes live in `src/app`:

- `/` - `src/app/page.tsx`.
- `/about`, `/services`, `/contacts`, `/privacy` - static public sections.
- `/portfolio` and `/portfolio/[slug]` - portfolio listing and project detail.
- `/order` and `/order/success` - order form and success page.
- `/api/analytics` - server-side endpoint for public page view and CTA click events.

Account routes:

- `/account` - client cabinet with own requests and contract-orders.
- `/account/login`, `/account/register` - client auth pages.
- Server actions: `src/app/account/actions.ts`.

Admin routes:

- `/admin/login` - admin sign-in.
- `/admin` - protected dashboard overview.
- `/admin/analytics` - request, contract, content analytics.
- `/admin/requests`, `/admin/requests/[id]`, `/admin/requests/export` - request management and XLSX export.
- `/admin/users`, `/admin/users/[id]` - user list, filters, profile card, role form.
- `/admin/pages` - page content editor and block builder.
- `/admin/projects`, `/admin/services`, `/admin/tags`, `/admin/images`, `/admin/notifications` - content and operational admin sections.
- Protected admin shell/layout: `src/app/admin/(protected)/layout.tsx` and `src/components/admin-shell.tsx`.

## Server Actions And Route Handlers

- `src/lib/actions/admin.ts` - admin mutations: content, pages, requests, contracts, images, notifications, user roles.
- `src/app/admin/login/actions.ts` - admin login.
- `src/app/order/actions.ts` - public order submission.
- `src/app/account/actions.ts` - client profile/auth and contract acceptance.
- `src/app/api/analytics/route.ts` - validates analytics event payloads and writes them with the server-side Supabase admin client.
- `src/app/admin/(protected)/requests/export/route.ts` - XLSX export route handler.

## Data Layer

- `src/lib/data/public.ts` - public content queries and demo fallback.
- `src/lib/data/admin.ts` - admin queries and demo fallback.
- `src/lib/data/client.ts` - authenticated client account data.
- `src/lib/data/notifications.ts` - admin notification data.
- `src/lib/data/mappers.ts` - maps Supabase rows into app types.
- `src/lib/demo-data.ts` - local fallback content when Supabase env is absent.
- `src/lib/types.ts` - app-level domain types.
- `src/lib/supabase/server.ts` - lazy Supabase server/admin clients.
- `src/lib/supabase/database.types.ts` - generated-style DB types; update when `supabase/schema.sql` changes.
- `src/lib/analytics-events.ts` - public analytics event payload normalization, daily source hashing, and insert payload helpers.
- `src/lib/analytics-routes.ts` - client-safe public route predicate used by analytics tracking.

## Domain Helpers

- `src/lib/order-calculator.ts` - preliminary price/duration calculation and formatting.
- `src/lib/validation.ts` - Zod schemas for forms and admin fields.
- `src/lib/request-status.ts` - request statuses and labels.
- `src/lib/page-blocks.ts` - editable page block row helpers for `/admin/pages`.
- `src/lib/admin-user-query.ts` - `/admin/users` query parsing/serialization.
- `src/lib/admin-analytics.ts` - `/admin/analytics` period parsing, KPI, distributions, trend and attention items.
- `src/lib/user-roles.ts` - admin/manager/client role labels.
- `src/lib/auth.ts` - current user/admin lookup and role guards.

## Components

- Admin UI: `src/components/admin-card.tsx`, `admin-form-lock.tsx`, `admin-request-status-form.tsx`, `admin-user-role-form.tsx`, `admin-page-form.tsx`, `admin-image-upload-form.tsx`, order/content forms.
- Public UI: `site-header.tsx`, `site-footer.tsx`, `project-card.tsx`, `project-gallery-slider.tsx`, `order-form.tsx`, `page-extra-blocks.tsx`, `analytics-tracker.tsx`.
- Shared form controls: `form-controls.tsx`, `limited-text-control.tsx`, `form-submit-button.tsx`, `confirm-submit-button.tsx`.

## Tests

- Unit/helper tests: `tests/*.test.ts`.
- E2E/browser tests: `tests/e2e/*.spec.ts`.
- Current focused helper tests:
  - `tests/page-blocks.test.ts` - page builder block serialization/reorder.
  - `tests/admin-user-query.test.ts` - users list query params.
  - `tests/admin-analytics.test.ts` - analytics periods, KPI, distributions, trend and attention items.
  - `tests/analytics-events.test.ts` - analytics payload normalization, source hashing, and insert payload privacy.
- Live Supabase smoke tests are opt-in only:
  - `SUPABASE_RLS_SMOKE=1 npm run test -- tests/supabase-rls-smoke.test.ts`
  - `PLAYWRIGHT_SUPABASE_E2E=1 npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line`

## Local Rules

- Do not commit `.env.local`.
- Do not add `VKR_text/` or `VKR_presentation/` to Git.
- Do not add `EXECPLAN-*` files without explicit confirmation.
- Do not push without separate confirmation.
- Do not describe online payment as implemented; it is only a future possibility.
- For admin QA, avoid mutating actions such as saving page changes or changing roles unless explicitly allowed.
- When structure changes, update this file in the same work item.
