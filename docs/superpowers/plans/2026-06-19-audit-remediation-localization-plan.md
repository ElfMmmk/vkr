# Remediate the Audit and Add Complete RU/EN Public Content Editing

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date while implementation proceeds.

This document follows the repository-level `PLANS.md`. It is self-contained so another engineer can resume the work from this file and the current working tree alone.

## Purpose / Big Picture

After this change, the public site can be used consistently in Russian or English, and an administrator can edit both language versions of every public content object from the existing administration screens. The same delivery also resolves all eight confirmed findings in `audit/audit-report.md`: claim tokens no longer enter analytics, the order timeline no longer invents a resend event, manager-facing language is role-appropriate, vulnerable dependencies are remediated, stale browser assertions are repaired, brief chips join cleanly, and registration errors no longer expose infrastructure details.

The user can observe the result by starting the Next.js application, selecting `EN` in the public header, navigating every public route at a 1366 by 768 viewport, and seeing English-only interface and seeded content. In the administration panel, each content editor exposes a stable `RU | EN` segmented control; switching languages preserves unsaved text, and one save persists Russian base fields together with an English row in `public.entity_translations`.

The structural database migration is delivered as a SQL file and is not applied by Codex. The user applied the structural migration and English seed manually on 2026-06-20 before live database verification.

## Progress

- [x] (2026-06-19 12:20Z) Read the approved design, repository `PLANS.md`, relevant Superpowers workflows, Supabase guidance, and current Git state.
- [x] (2026-06-19 12:24Z) Confirmed that the checkout is a normal working tree on `vkr_max/order-admin-usability-refresh` and contains pre-existing user edits that must be preserved.
- [x] (2026-06-19) Recorded the pre-final regression baseline: 95 tests passed, 2 failed, 1 skipped, and one suite could not load because the remaining localization module did not yet exist. Type checking failed for the same missing module; lint passed.
- [x] (2026-06-19) Added regression coverage for analytics sanitization, timeline ordering, brief punctuation, public authentication copy, translation payload handling, role feedback, account localization, translation cleanup, image-upload rollback, and XLSX export.
- [x] (2026-06-19) Implemented the focused audit fixes for analytics privacy, timeline ordering, manager/admin messaging, brief punctuation, and infrastructure-safe registration errors.
- [x] (2026-06-19) Added translation helpers, database types, the structural migration, the idempotent English seed, and database trigger cleanup without applying SQL to the live project.
- [x] (2026-06-19) Added reusable bilingual administration controls and RU-base/EN-translation persistence for pages, services, packages, add-ons, projects, tags, and images.
- [x] (2026-06-19) Completed public and authenticated-account RU/EN localization, including request snapshots, statuses, timeline events, estimates, dates, notices, attachment controls, and modal copy.
- [x] (2026-06-19) Repaired stale Playwright locators, added English/public overflow assertions, and configured the default desktop viewport to `1366x768`.
- [x] (2026-06-19) Updated Vitest and compatible dependency overrides, retained ExcelJS 4.4.0, and added an XLSX workbook smoke test. No forced audit fix was used.
- [x] (2026-06-19) Updated `audit/audit-report.md` and this plan with implementation status and manual migration constraints.
- [x] (2026-06-20) Completed final repository verification: 108 unit tests passed with one opt-in smoke skipped, typecheck/lint/build passed, and both dependency audits reported zero vulnerabilities.
- [x] (2026-06-20) Completed desktop browser verification at `1366x768`: public Playwright 20/20 and accessibility Playwright 11/11 passed; mobile/tablet cases remained intentionally excluded.
- [x] (2026-06-20) User manually applied the structural migration and idempotent English seed. Live Supabase role suite passed 14/14, including the added English authenticated-account flow.
- [x] (2026-06-20) Confirmed live cleanup counters are zero for `pw-smoke-*` requests, services, analytics events, images, order attachments, and Auth users.

## Surprises & Discoveries

- Observation: The project instruction mentioned `.agent/PLANS.md`, but the authoritative plan format is stored at repository root as `PLANS.md`.
  Evidence: `.agent/PLANS.md` and `.agents/PLANS.md` are absent; `PLANS.md` exists and defines the mandatory ExecPlan format.

- Observation: The current checkout is not an isolated worktree and has two tracked user modifications plus two untracked development logs.
  Evidence: `git status --short` reports `src/app/account/requests/[id]/page.tsx`, `tests/request-history-copy.test.ts`, `.codex-devserver.stderr.log`, and `.codex-devserver.stdout.log`.

- Observation: The Supabase CLI is not installed in this environment.
  Evidence: `Get-Command supabase` returned no command. Migration filenames must therefore be created manually in the repository while preserving the existing timestamp convention; the migration will not be applied by Codex.

- Observation: The user required all automated checks to be deferred until every code and documentation change was complete.
  Evidence: The approved implementation plan explicitly permits only source reading and static review during implementation and requires one final verification sequence.

- Observation: Historical request rows contain Russian entity snapshots, but user-authored briefs, comments, messages, and agreed scope must remain untouched.
  Evidence: Account localization therefore resolves service, package, add-on, and project snapshots through translation rows by entity ID and uses English placeholders when a required translation is absent.

- Observation: A polymorphic translation table cannot use ordinary foreign keys to every supported base table.
  Evidence: Cleanup is enforced both by authenticated application helpers and by per-table `after delete` triggers that delete the matching `(entity_type, entity_id)` rows transactionally.

- Observation: Installing the approved dependency versions under Node.js 20.17.0 reports an engine warning for `eslint-visitor-keys@5.0.1`, which requires Node.js 20.19 or newer.
  Evidence: `npm install --no-audit --no-fund` completed successfully but emitted the engine warning. The final lint/build run will determine current operability; migration to Node.js 22 remains a separate follow-up task.

- Observation: The first remediation Playwright run exposed only test-contract drift, not rendered application failures.
  Evidence: 21 public tests passed. The five failures expected the old admin-login heading, used a non-exact `en` accessible-name match, or used an unscoped duplicate CTA locator. These locators were updated.

- Observation: The post-fix Playwright rerun and accessibility suite could not be executed in the same session.
  Evidence: The execution environment rejected the rerun because its usage limit was reached and reported availability after 2026-06-20 00:13 MSK. The plan therefore does not claim final browser-suite success.

- Observation: Supabase SQL Editor displayed a table-without-RLS warning while running the seed even though the seed contains no `create table` or `alter table` statements and live RLS was enabled.
  Evidence: File inspection found seven idempotent `insert ... on conflict ... do update` statements and zero table DDL statements. Live checks returned `relrowsecurity = true` and the expected public SELECT policy. The user safely chose `Run without RLS`; existing RLS remained enabled.

- Observation: Bilingual editor state changed the DOM contract for admin E2E tests.
  Evidence: Translatable base values are submitted through hidden named inputs while visible controlled inputs are reached by labels/placeholders. Live test locators were updated to target visible controls and scope duplicate attachment/timeline text.

## Decision Log

- Decision: Work in the current checkout instead of creating a new worktree.
  Rationale: The approved work must integrate with existing uncommitted user changes in the request-detail page and its source-contract test. A new worktree from `HEAD` would omit those changes and increase merge risk. No commit, reset, checkout, or unrelated cleanup will be performed.
  Date/Author: 2026-06-19 / Codex

- Decision: Keep Russian canonical fields in existing entity tables and store English text in `public.entity_translations`.
  Rationale: This matches the user's explicit choice, preserves all existing content and relationships, and provides one uniform translation model for every public entity.
  Date/Author: 2026-06-19 / User and Codex

- Decision: Use one reusable `RU | EN` editor primitive and serialized English payloads submitted with existing forms.
  Rationale: The administration panel is primarily server-rendered and already uses server actions. A small client control can preserve both language states without duplicating shared numeric, ordering, relation, and publication fields.
  Date/Author: 2026-06-19 / Codex

- Decision: Enforce analytics privacy at both client construction and server parsing.
  Rationale: Client sanitization prevents unnecessary transmission, while server sanitization is the actual security boundary and also protects direct API calls or older clients.
  Date/Author: 2026-06-19 / Codex

- Decision: Do not apply any SQL migration to the configured Supabase project.
  Rationale: The user explicitly requested a migration file they will execute. Code and schema tests will validate the artifact locally; live translation flows remain pending until the user confirms migration application.
  Date/Author: 2026-06-19 / User and Codex

- Decision: Treat SQL application as user-owned and resume live verification only after explicit confirmation.
  Rationale: The user applied both SQL files manually and confirmed RLS remained enabled. Codex then ran read/write smoke scenarios only against prefixed temporary data with cleanup.
  Date/Author: 2026-06-20 / User and Codex

- Decision: Run no intermediate unit, type, lint, build, audit, or Playwright checks after implementation began.
  Rationale: The user explicitly requested one consolidated final verification after all source and documentation changes.
  Date/Author: 2026-06-19 / User

- Decision: Localize persisted request snapshots at read time by their entity IDs and never translate user-authored request text.
  Rationale: This provides correct English historical orders without rewriting transactional records or misclassifying client text as catalog content.
  Date/Author: 2026-06-19 / Codex

- Decision: Combine application cleanup with database delete triggers for `entity_translations`.
  Rationale: Application cleanup gives explicit behavior and logging, while triggers close deletion paths outside the current server actions and keep cleanup in the base-row transaction.
  Date/Author: 2026-06-19 / Codex

- Decision: Keep ExcelJS 4.4.0 and constrain vulnerable transitive packages through overrides, backed by a workbook-structure smoke test.
  Rationale: The application only uses the writer path. This avoids a broader export rewrite while verifying that headers, rows, and worksheet structure remain readable.
  Date/Author: 2026-06-19 / Codex

## Outcomes & Retrospective

Implementation and documentation are complete. The code now covers all eight audit findings, complete RU/EN public and authenticated-account localization, bilingual administration editors, translation lifecycle cleanup, image-upload rollback, and XLSX dependency compatibility coverage.

Final verification records 108 passing unit tests with one intentionally skipped opt-in smoke test, passing typecheck/lint/build, and zero production or development dependency vulnerabilities. Desktop public Playwright passed 20/20 and accessibility Playwright passed 11/11. Manual browser QA at `1366x768` confirmed RU→EN switching, English document language, no horizontal overflow, no framework error overlay, and no application console errors.

The user applied the structural migration followed by the English seed. The full live Supabase suite passed 14/14, covering admin/manager/client boundaries, English authenticated-account pages, analytics privacy, XLSX export, ordering, guest claim, private attachments, page restoration, role restoration, registration, contract revision/resend/acceptance, and image upload/delete. Post-suite read-only aggregation confirmed zero remaining `pw-smoke-*` rows or users.

The implementation plan is complete. No SQL was applied by Codex, and no commit or push was performed.

## Context and Orientation

This is a Next.js App Router application using React 19, TypeScript, Supabase, Vitest, and Playwright. Public routes live under `src/app`; server-side data loaders live in `src/lib/data`; content management actions are concentrated in `src/lib/actions/admin.ts`; and administration screens are under `src/app/admin/(protected)`.

The locale cookie is read through `src/lib/i18n-server.ts`. `src/lib/i18n.ts` currently contains a small typed dictionary and must become the source of all static public interface copy. Editable Russian content comes from base tables such as `pages`, `services`, and `projects`. `src/lib/data/public.ts` already reads some rows from `entity_translations`, but it currently covers only a subset of entity types and falls back visibly to Russian when English data is absent. English mode must instead use translated text, omit optional untranslated blocks, or use neutral English placeholders for required fields.

`public.entity_translations` is defined near the end of `supabase/schema.sql` and represented in `src/lib/supabase/database.types.ts`. Its `entity_type` check currently does not support service packages or service add-ons. The new migration must extend that constraint and delete historical analytics rows containing claim parameters. Existing row-level security remains unchanged: public clients may read public translations, while writes use the server-side secret client after existing role guards.

The security finding begins in `src/app/order/actions.ts`, where the guest success URL includes a one-time `claim` query parameter. `src/components/analytics-tracker.tsx` currently forwards the browser search string and referrer, while `src/lib/analytics-events.ts` accepts and stores them. A shared sanitizer must retain only explicitly safe public filters and remove secrets from search strings and URLs.

The other focused findings are implemented in `src/lib/request-timeline.ts`, `src/lib/order-draft.ts`, `src/lib/auth-errors.ts`, `src/lib/auth.ts`, and manager-facing components. Existing tests in `tests/order-experience.test.ts`, `tests/analytics-events.test.ts`, `tests/auth-errors.test.ts`, and `tests/request-history-copy.test.ts` provide the nearest regression locations.

## Plan of Work

### Milestone 1: Establish the baseline and fix self-contained audit findings

Run `npm run test` before production edits and record the exact baseline. Add tests first for unsafe analytics payloads, malformed brief joining, the false timeline resend, infrastructure wording in registration errors, and role-aware access feedback. Each test must be executed once in its failing state before the corresponding production edit.

Create `src/lib/analytics-sanitizer.ts` with pure functions for sanitizing search strings, absolute or relative href values, and referrers. The safe query allowlist should contain only public presentation filters that the application intentionally uses, such as portfolio sorting and filtering. Keys such as `claim`, `token`, `code`, `email`, `request`, and unknown keys must be dropped. Update `src/components/analytics-tracker.tsx` to sanitize before sending, and update `src/lib/analytics-events.ts` to sanitize again before constructing the database insert. Tests must prove that legitimate filters remain and claim values do not appear anywhere in the parsed insert.

Update `src/lib/request-timeline.ts` so an accepted request does not gain a synthetic “terms resent” event merely because acceptance changed `updated_at`. Preserve initial send, revision request, and a provable resend that occurred before acceptance. Add chronological assertions in `tests/order-experience.test.ts`.

Update `src/lib/order-draft.ts` so `appendBriefChip` normalizes only the joining boundary. It must avoid `.,`, duplicate commas, and repeated chips while preserving the user's actual preceding sentence. Update `src/lib/auth-errors.ts` so public copy describes what the user can do and never names Supabase, SMTP, a database, a bucket, or internal configuration.

Use neutral shared-panel language in `src/components/login-form.tsx`, `src/app/admin/login/page.tsx`, and `src/components/admin-shell.tsx`. Make `src/app/admin/(protected)/page.tsx` show manager-specific order/request guidance and administrator-specific content guidance. Extend the redirect produced by `requireContentAdmin` in `src/lib/auth.ts` with a safe notice code, and render that notice visibly on the destination page.

Milestone acceptance is focused Vitest success, no sensitive value in an analytics insert fixture, no false timeline event, clean brief punctuation, and user-facing authentication text.

### Milestone 2: Add translation interfaces and database artifacts

Create `src/lib/entity-translations.ts` as the single domain boundary for translation entity types, JSON field validation, empty-payload detection, and safe field extraction. Add tests in `tests/entity-translations.test.ts` before implementation. The module must expose the supported entity types and helper functions used by both public loaders and admin actions.

Update `src/lib/supabase/database.types.ts` to match the expanded constraint at the TypeScript level without changing generated table shapes unnecessarily. Update `supabase/schema.sql` so a fresh installation supports `page`, `service`, `service_package`, `service_addon`, `project`, `tag`, and `image`.

Create `supabase/migrations/20260619000000_extend_entity_translations_and_cleanup_analytics.sql`. The SQL must locate and replace the existing `entity_translations_entity_type_check` constraint, preserve current rows, and delete only analytics rows whose `search`, `href`, or `referrer` contain a claim parameter. It must be safe for the current schema and must not weaken row-level security or grants. Extend `tests/supabase-schema.test.ts` to inspect both `supabase/schema.sql` and the migration contents.

Create `supabase/migrations/20260619001000_seed_english_entity_translations.sql` with idempotent `insert ... select ... on conflict ... do update` statements for current pages, services, packages, add-ons, projects, tags, and image text. Stable page keys and slugs should be used where available; child entities should be selected through their parent service plus stable Russian titles. The seed must be repeatable and must not delete editor-created translations.

Milestone acceptance is passing helper/schema tests and a migration file the user can run manually without Codex touching the live database.

### Milestone 3: Persist bilingual content from every administration editor

Create `src/components/admin-locale-fields.tsx`, a client component that renders a fixed-size `RU | EN` segmented control and preserves unsaved state for both languages. It should accept field descriptors or focused child render functions rather than owning entity-specific database logic. The selected language changes only the translatable controls; shared fields remain stable and visible.

Extend `src/lib/data/admin.ts` with one batched English translation loader and attach or return translation fields for administration lists. Avoid one query per item. Pages, services, packages, add-ons, projects, tags, and images must all load their English row when present.

Extend `src/lib/actions/admin.ts` with authenticated helpers that parse a serialized English payload, validate field lengths, upsert a public English translation after the base mutation, and delete the translation row when all supported fields are empty. New entities must obtain their generated UUID before the translation write. A translation failure must return or throw an explicit failure rather than report full success. Revalidate both Russian and English public paths through the existing cookie-independent route URLs.

Update `src/components/admin-page-form.tsx` for bilingual title, body, and block values while sharing block keys and order. Update the editors in `src/app/admin/(protected)/services/page.tsx`, `projects/page.tsx`, `tags/page.tsx`, and `images/page.tsx` so each relevant form includes the same language control and serialized English payload. Image upload and image edit paths must support English title and caption; package and add-on editors must support every field listed in the approved design.

Add source-contract or component tests that prove all seven entity types expose the control and submit an English payload. Where practical, pure state/serialization behavior belongs in unit tests rather than brittle markup snapshots.

Milestone acceptance is that switching between RU and EN preserves unsaved values, shared fields do not reset, and server-action tests or source contracts prove the correct upsert/delete behavior.

### Milestone 4: Complete public localization

Expand `src/lib/i18n.ts` into a typed dictionary covering the home page, about, services, portfolio list and detail, contacts, privacy, order wizard and success, account login and registration, header, footer, not-found, validation labels, empty states, and public CTA labels. Keep dictionary objects at module scope.

Update every public route to read `getLocale()` and use the dictionary. The complete route list is `/`, `/about`, `/services`, `/portfolio`, `/portfolio/[slug]`, `/contacts`, `/privacy`, `/order`, `/order/success`, `/account/login`, `/account/register`, plus shared header/footer and `not-found`.

Refactor `src/lib/data/public.ts` so pages, services, packages, add-ons, projects, tags, and images are localized in batched passes. In English mode, translated required fields use a neutral English placeholder when absent; optional descriptions, captions, and page blocks are omitted rather than replaced by Russian. Do not alter user-entered request messages or order briefs.

Provide complete in-repository English fallback content for demo mode in `src/lib/demo-data.ts` and `src/lib/demo-catalog.ts` or a focused adjacent module. This is necessary because the application intentionally runs without Supabase, and browser tests must be able to verify English mode before the user applies the live migration.

Update public components such as `site-header`, `site-footer`, project cards, gallery controls, order form steps, and account forms to receive or read translated labels without introducing client-side data waterfalls.

Add unit/source-contract tests for English fallback behavior and Playwright coverage that selects English, visits every public route, and checks both expected English copy and absence of a bounded list of known Russian markers.

Milestone acceptance is a consistently English demo-mode public site with no visible Russian fallback in editable or static content.

### Milestone 5: Repair browser suites and validate role behavior

Repair the stale assertions in `tests/e2e/supabase-admin.spec.ts`: use the current analytics label, scope service package/add-on operations to direct `<details>` children, assert attachment filename text separately from the “Download” link, scope page editor summaries with `:scope > summary`, and use an exact “Order” heading where required. Remove serial coupling only where setup and cleanup are independent; do not duplicate expensive fixtures merely to satisfy style.

Add or update manager browser assertions for neutral login text, manager dashboard guidance, protected content-route redirects, and the visible no-access notice. Add a claim-token analytics regression that creates only prefixed temporary data and verifies the stored row contains no claim value.

Run public and accessibility Playwright suites at the configured desktop viewport. Once the user applies both SQL files, run the full live Supabase role suite and verify cleanup counters return to zero. Credentials remain environment/runtime secrets and must never be copied into reports, screenshots, committed files, or terminal transcripts included in documentation.

Milestone acceptance is no stale locator failure, no horizontal overflow on audited desktop routes, and all runnable role flows passing.

### Milestone 6: Remediate dependencies and complete verification

Inspect the dependency paths reported by `npm audit`. Upgrade Vitest and compatible transitive packages through normal semver updates. For ExcelJS advisories, prefer a compatible override only after running the XLSX export path and tests; if the fixed `uuid` major is incompatible, replace only the spreadsheet writer with a maintained package that produces the same exported workbook behavior. Never use `npm audit fix --force`.

Run the complete verification sequence: unit tests, type checking, lint, production build, public Playwright, accessibility Playwright, relevant live Supabase tests after migration confirmation, `npm audit --omit=dev`, and full `npm audit`. Start the development server on an available local port and inspect the primary public and admin screens at 1366 by 768, including overflow and console/network errors.

Update `audit/audit-report.md` so each finding records its remediation, files, test evidence, and any live verification still waiting on migration application. Update this ExecPlan's progress, discoveries, decisions, and outcomes at each stopping point.

## Concrete Steps

All commands run from `C:\Users\forma\Desktop\vkr\code`.

The baseline and focused TDD loop use:

    npm run test
    npm run test -- tests/analytics-events.test.ts
    npm run test -- tests/order-experience.test.ts
    npm run test -- tests/auth-errors.test.ts
    npm run test -- tests/entity-translations.test.ts
    npm run test -- tests/supabase-schema.test.ts

For each behavior, run the focused test after adding the test and before production code. The expected first result is a failure that specifically identifies the missing sanitizer, incorrect timeline event, malformed punctuation, internal error copy, or missing translation helper. After the production edit, rerun the same command and expect all tests in that file to pass.

Repository-wide verification uses:

    npm run test
    npm run typecheck
    npm run lint
    npm run build
    npm audit --omit=dev
    npm audit

Browser verification uses the existing Playwright configuration:

    npx playwright test tests/e2e/public.spec.ts --grep-invert "mobile|tablet"
    npx playwright test tests/e2e/accessibility.spec.ts

The live suite is run only after the user applies the supplied migrations and with the existing environment flag:

    $env:PLAYWRIGHT_SUPABASE_E2E='1'
    npx playwright test tests/e2e/supabase-admin.spec.ts

The development server is started on an unused port with:

    npm run dev -- --hostname 127.0.0.1 --port 3000

If port 3000 is occupied, use 3001 or the next free port. Browser inspection uses a 1366 by 768 viewport. Expected evidence includes no horizontal scrollbar, no clipped labels, no console errors, successful role redirects, and English-only public content after selecting EN.

## Validation and Acceptance

The analytics regression passes only when a payload containing `/order/success?claim=secret-value` produces an insert whose `search`, `href`, and `referrer` contain no `claim` key or secret value, while a safe portfolio filter remains.

The timeline regression passes only when acceptance adds the accepted event but no simultaneous synthetic resend. A separate fixture with a provable resend before acceptance must still show the resend in chronological order.

The translation tests pass only when supported fields are validated, all-empty English payloads request deletion, unsupported keys are ignored or rejected according to the helper contract, and English public mapping never returns Russian base text for a missing translated field.

The administration browser flow passes only when an editor can enter RU and EN values, switch repeatedly without losing either unsaved value, save once, reload, and see both values restored. The public English route must then show the saved English value.

The public localization suite passes only when all scoped routes render expected English controls and do not contain the known Russian headings or fallback entity titles. User-authored request text is exempt.

The final repository state is accepted when `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass; dependency audits have no remediable advisory left; desktop browser checks show no clipping or horizontal overflow; and every live scenario that does not depend on unapplied SQL passes. After the user applies the migration, the remaining translation and cleanup scenarios must also pass.

## Idempotence and Recovery

Unit, type, lint, build, and Playwright commands are repeatable. Temporary browser and database records must retain the existing `qa-audit-*`, `pw-smoke-*`, or `rls-smoke-*` prefixes and be removed in `finally` cleanup.

The structural migration is intentionally one-way and should be applied once through the Supabase SQL editor or the user's normal migration process. Its analytics deletion is limited to rows containing claim parameters. The English seed uses conflict upserts and is safe to rerun; it must update only the explicitly selected current content.

If a base entity save succeeds but the English upsert fails, the server action must surface the failure. Retrying the same form is safe because the base update is idempotent and the translation uses the unique `(entity_type, entity_id, locale)` key.

Do not remove or regenerate `.codex-devserver.stderr.log` or `.codex-devserver.stdout.log`, do not stage them, and do not revert the pre-existing edits in the request-detail page or its source-contract test.

## Artifacts and Notes

The approved design is preserved at `docs/superpowers/specs/2026-06-19-audit-remediation-localization-design.md`.

The current branch starts from commit `166978c` with message `stable version 4.2`.

Expected new database artifacts are:

    supabase/migrations/20260619000000_extend_entity_translations_and_cleanup_analytics.sql
    supabase/migrations/20260619001000_seed_english_entity_translations.sql

The migration is delivered for manual execution. No command in this plan applies it to a live database.

## Interfaces and Dependencies

`src/lib/analytics-sanitizer.ts` must export pure functions equivalent to:

    sanitizeAnalyticsSearch(search: string): string
    sanitizeAnalyticsHref(href: string): string
    sanitizeAnalyticsReferrer(referrer: string): string

`src/lib/entity-translations.ts` must define the seven supported entity types and expose parsing helpers used by admin actions and public loaders. The exact internal representation may follow repository conventions, but the public behavior must include validated JSON fields, an all-empty check, and English translation selection without Russian fallback.

The reusable bilingual editor must use React state only for unsaved text and language selection. Server Components remain responsible for data loading. Existing Supabase server clients in `src/lib/supabase/server.ts` remain the only database client boundary; no service-role key may enter a client component.

The project continues using Next.js server actions, Supabase row-level security, Vitest, and Playwright. Dependency changes must be limited to packages needed to remove the confirmed advisories or preserve XLSX export behavior.

Plan revision note: Created on 2026-06-19 to translate the approved audit-remediation design into a self-contained implementation and verification sequence while preserving the user's current working-tree changes. Revised on 2026-06-19 after implementation to record the consolidated-verification decision, completed remediation work, dependency strategy, and live-SQL verification boundary. Revised on 2026-06-20 after user-applied migrations and successful public, accessibility, live-role, and cleanup verification.
