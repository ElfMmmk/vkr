# Analytics V2 and Admin E2E Cleanup

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. This document follows `PLANS.md` in the repository root.

## Purpose / Big Picture

Analytics V1 shows operational request and content metrics but cannot show public traffic because the database has no event table. This work adds a small server-side analytics pipeline for public page views and explicit CTA clicks, then exposes those numbers in `/admin/analytics`. The feature must not store raw IP addresses or user-agent strings, must not track admin/account/API routes, and must leave live Supabase changes as manual SQL for the user to run.

## Progress

- [x] (2026-06-05 00:00Z) Confirmed local Git state: `master` is one commit ahead of `origin/master` at `1ae0a32 unstable-version 3.1`.
- [x] (2026-06-05 00:00Z) Initial push request for `unstable-version 3.1` was rejected by approval policy because the user still needed to explicitly confirm publishing `origin/master`.
- [x] (2026-06-05 16:00Z) After explicit user confirmation, pushed `1ae0a32 unstable-version 3.1` from `master` to `origin/master`.
- [x] (2026-06-05 00:00Z) Created local implementation branch `vkr_max/analytics-v2-e2e`.
- [x] (2026-06-05 00:00Z) Add failing tests for analytics event payload normalization, source hashing, and traffic aggregation.
- [x] (2026-06-05 00:00Z) Add Supabase analytics event SQL and generated-style DB types.
- [x] (2026-06-05 00:00Z) Add analytics API route and public client tracker.
- [x] (2026-06-05 00:00Z) Extend `/admin/analytics` with traffic KPIs, top pages, and top CTA clicks.
- [x] (2026-06-05 00:00Z) Extend live Supabase e2e cleanup scenarios for analytics, page blocks, and user roles.
- [x] (2026-06-05 00:00Z) Update project docs.
- [x] (2026-06-05 00:00Z) Run full local validation commands from the user plan.
- [x] (2026-06-05 16:00Z) Run live Supabase e2e after applying `supabase/migrations/20260605000000_analytics_events.sql` in SQL Editor.
- [x] (2026-06-05 16:00Z) Run opt-in Supabase RLS smoke after applying the SQL.

## Surprises & Discoveries

- Observation: `supabase` CLI is not installed in this environment.
  Evidence: `supabase --version` returned `CommandNotFoundException` during planning, so the migration file is created manually and documented for SQL Editor execution.
- Observation: Git push approval was rejected before implementation.
  Evidence: approval reviewer rejected `git push origin master` because publishing `origin/master` still needs a separate explicit user confirmation.
- Observation: The first live e2e run reused/stumbled over a stale Next dev server and later exposed brittle waits in older service/image smoke checks.
  Evidence: clean reruns showed the Analytics V2, `/admin/pages`, and `/admin/users` checks passing; service/image checks were stabilized by polling Supabase state and using `finally` cleanup.

## Decision Log

- Decision: Track only public `page_view` and explicit `cta_click` events.
  Rationale: This matches the approved V2 scope and avoids mixing admin work with customer traffic.
  Date/Author: 2026-06-05 / Codex
- Decision: Store `source_hash`, not raw IP or raw user-agent.
  Rationale: Admin analytics needs daily unique visitor estimates without retaining direct visitor identifiers.
  Date/Author: 2026-06-05 / Codex
- Decision: Do not grant `anon` or `authenticated` access to `public.analytics_events`.
  Rationale: Events are written by the server-side secret/service-role client only; public browser clients post to a Next.js route.
  Date/Author: 2026-06-05 / Codex
- Decision: Continue implementation locally after push approval failed.
  Rationale: Local V2 work is safer than bypassing push approval and does not publish repository contents.
  Date/Author: 2026-06-05 / Codex
- Decision: Treat Supabase state as the authoritative assertion for mutating live e2e cleanup.
  Rationale: Server actions can finish slower than a default UI assertion, while DB polling proves the mutation and prevents false negatives.
  Date/Author: 2026-06-05 / Codex

## Outcomes & Retrospective

Analytics V2 implementation is complete locally. Public tracking, admin traffic aggregation, private Supabase SQL, docs, and opt-in live e2e cleanup scenarios were added. Local validation passed: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, public Playwright e2e, and `git diff --check`. After the user applied the SQL, live Supabase e2e passed with `7 passed`, opt-in RLS smoke passed, and a read-only cleanup audit found zero remaining `pw-smoke-*` or `rls-smoke-*` records/users.

## Context and Orientation

The project is a Next.js App Router portfolio application using Supabase Postgres/Auth/Storage. Public routes are under `src/app`, admin routes are under `src/app/admin/(protected)`, and server-side Supabase clients live in `src/lib/supabase/server.ts`. Analytics V1 is implemented in `src/lib/admin-analytics.ts` and rendered by `src/app/admin/(protected)/analytics/page.tsx`. The current schema is in `supabase/schema.sql`; generated-style TypeScript database types are maintained manually in `src/lib/supabase/database.types.ts`.

An analytics event means one row representing either a public page view or an explicit CTA click. A CTA is a deliberate call-to-action link marked with `data-analytics-cta="true"`, not every ordinary navigation link.

## Plan of Work

First, add tests that fail because analytics V2 helpers and fields do not exist yet. Then create `public.analytics_events` SQL, update database types and data-layer mappers, and add helper functions that normalize browser payloads and aggregate traffic by period. Next, add `POST /api/analytics` to write events via the server-side admin client and add a client tracker in the root layout that ignores `/admin`, `/account`, and `/api`. Finally, extend the admin analytics page, live e2e smoke tests, `PROJECT_STRUCTURE.md`, and `supabase/README.md`.

## Concrete Steps

All commands run from `C:\Users\forma\Desktop\vkr\code`.

Run targeted tests after adding failing tests:

    npm run test -- tests/analytics-events.test.ts tests/admin-analytics.test.ts

Expected before implementation: tests fail because V2 exports/types are missing. Expected after implementation: both files pass.

Run full validation at the end:

    npm run test
    npm run typecheck
    npm run lint
    npm run build
    npm run test:e2e -- tests/e2e/public.spec.ts --reporter=line
    git diff --check

Optional live Supabase validation after manually applying SQL:

    $env:PLAYWRIGHT_SUPABASE_E2E='1'
    $env:PLAYWRIGHT_PORT='3003'
    npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line

## Validation and Acceptance

The feature is accepted when unit tests show payload normalization and aggregation, the admin analytics page renders traffic KPIs and top lists, the public e2e suite still passes, and the live Supabase e2e suite can create and clean temporary analytics/page/user data after the migration SQL is applied manually.

Manual validation is: run the migration SQL in Supabase SQL Editor, open public pages, click marked CTA buttons, sign into admin, and check `/admin/analytics?period=7`, `/admin/analytics`, `/admin/analytics?period=90`, and `/admin/analytics?period=all`.

## Idempotence and Recovery

The SQL uses `create table if not exists`, `create index if not exists`, `alter table ... enable row level security`, explicit `revoke`, and explicit `grant`, so running it more than once is safe. The e2e scenarios must use unique `pw-smoke-*` prefixes and cleanup in `finally` or `afterAll`, restoring page snapshots and deleting temporary users/events.

## Artifacts and Notes

Live Supabase mutation is limited to opt-in QA fixtures with `pw-smoke-*` and `rls-smoke-*` prefixes. The migration file remains the artifact for manual SQL Editor execution in environments where Supabase CLI is unavailable.

## Interfaces and Dependencies

At completion, `src/lib/analytics-events.ts` provides payload parsing and source hash helpers. `src/lib/admin-analytics.ts` accepts `analyticsEvents` in `buildAdminAnalytics` and exposes traffic metrics. `src/app/api/analytics/route.ts` accepts `POST` JSON payloads for `page_view` and `cta_click`. `src/components/analytics-tracker.tsx` sends browser events and is mounted from `src/app/layout.tsx`.
