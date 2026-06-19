# Audit Remediation And Full Public Localization Design

Date: 2026-06-19

## Goal

Fix all eight confirmed findings from `audit/audit-report.md` and make the public site fully bilingual in Russian and English.

The administrative interface remains Russian. Editors use a `RU | EN` segmented control to edit both language versions of every public content object.

## Scope

The implementation covers:

- analytics claim-token sanitization and historical cleanup SQL;
- complete public RU/EN localization;
- bilingual editing for pages, services, packages, add-ons, projects, tags, and image text;
- stale live Playwright test repair;
- order timeline correction;
- manager-facing terminology and access feedback;
- dependency vulnerability remediation;
- brief-chip punctuation normalization;
- user-oriented registration errors.

Mobile-specific redesign is not part of this work. Existing responsive behavior must not regress.

## Translation Storage

Russian remains the canonical content in the existing entity tables.

English content is stored in `public.entity_translations`:

```text
entity_type
entity_id
locale = en
fields = JSON object with translated fields
is_public
```

The existing unique key `(entity_type, entity_id, locale)` remains the upsert boundary.

The migration extends the `entity_type` constraint to support:

- `page`
- `service`
- `service_package`
- `service_addon`
- `project`
- `tag`
- `image`

No English fields are added to the main entity tables.

## Migration Delivery

Codex creates a timestamped SQL file under `supabase/migrations/`.

Codex does not apply the migration to the live Supabase project. The user applies the supplied file manually.

The migration must:

1. Extend the `entity_translations.entity_type` check constraint.
2. Delete historical analytics rows whose `search`, `href`, or `referrer` contains sensitive claim parameters.
3. Preserve all existing Russian content and existing translations.
4. Be safe to run once against the current schema.

Application code must remain backward-compatible until the migration is applied where feasible. Translation writes for new entity types will require the migration.

## Translation Fields

### Pages

- `title`
- `body`
- `blocks`

Block keys remain stable technical identifiers shared by RU and EN. Only block values are translated.

### Services

- `title`
- `description`
- `details`

### Service packages

- `title`
- `description`
- `badge`
- `bestFor`
- `outcome`
- `includedItems`

Prices, durations, display order, active state, recommendation state, and recommendation tags are language-neutral.

### Service add-ons

- `title`
- `description`

Prices, durations, display order, and active state are language-neutral.

### Projects

- `title`
- `shortDescription`
- `fullDescription`

Slug, services, tags, gallery relations, publication state, and ordering are language-neutral.

### Tags

- `title`
- `description`

### Images

- `title`
- `caption`

Storage path, URL, parent relation, and ordering are language-neutral.

## Admin Editing Experience

Each form that edits public text gets a segmented `RU | EN` control above the translatable fields.

Behavior:

- switching language never submits the form;
- unsaved edits for both languages stay in component state;
- one save action persists Russian base fields and English translation fields together;
- RU fields use the current validation rules;
- EN fields use equivalent length limits;
- English content may be initially empty while editors populate existing records;
- publication is not automatically blocked by missing EN text during migration rollout;
- the public EN site must never silently mix English interface text with Russian content.

For pages:

- RU and EN have separate title, body, and block values;
- block structure and keys are shared;
- adding, deleting, or moving a block changes the shared structure;
- a newly added block starts with an empty EN value;
- previews display the currently selected language.

For services, projects, tags, packages, add-ons, and images:

- non-text fields remain visible and shared;
- only translated text controls change when switching RU/EN.

The control uses stable dimensions and clear selected state. It is not a pair of navigation links.

## Save Data Flow

Each relevant server action receives:

- normal Russian fields;
- a serialized English translation payload;
- entity identity and type.

The action:

1. Authenticates an admin with existing server-side role guards.
2. Validates Russian and English payloads.
3. Saves the base entity.
4. Upserts the English row in `entity_translations`.
5. Deletes the English translation row when all English text fields are empty.
6. Revalidates relevant RU and EN public routes.
7. Returns a clear success or error state.

For newly created entities, the base row is created first so its generated UUID can be used as `entity_id`.

Partial failure must not be reported as full success. Where a database transaction is unavailable through the current REST client, the action must surface translation-save failure and retain enough context for a retry.

## Public Localization

Every public route reads the selected locale:

- `/`
- `/about`
- `/services`
- `/portfolio`
- `/portfolio/[slug]`
- `/contacts`
- `/privacy`
- `/order`
- `/order/success`
- `/account/login`
- `/account/register`
- public header and footer
- public not-found state

Public copy is divided into:

1. Static interface copy in typed dictionaries.
2. Editable content loaded from base tables plus `entity_translations`.

English mode rules:

- use English translation when present;
- for missing editable translations, use an explicit neutral English placeholder or omit the optional block;
- do not fall back to visible Russian text on an English page;
- slugs and route URLs stay unchanged;
- user-created request content remains in the language entered by the user and is not machine-translated.

The initial implementation includes complete English translations for current public demo/live content through a seed/update SQL file or translation upsert script that is delivered for manual execution.

## Finding Remediation

### F-001 Analytics secrets

- Add a shared analytics sanitizer with an allowlist of safe query parameters.
- Remove `claim`, tokens, auth codes, email-like identifiers, and other sensitive values from `search`, `href`, and `referrer`.
- Exclude or sanitize `/order/success`.
- Add unit tests and a live-safe regression test.
- Include historical cleanup in the supplied migration.

### F-002 Mixed localization

- Complete typed static dictionaries.
- Pass locale to all public data loaders.
- Add English content editing and seed data.
- Add e2e checks that EN pages do not contain expected Russian UI/content markers.

### F-003 Stale live role suite

Repair five stale locator groups:

- analytics copy;
- collapsible service item ordering;
- attachment accessible-name assertions;
- page editor summary scope;
- exact order heading match.

Split independent live workflows or remove unnecessary serial coupling where cleanup permits.

### F-004 False resend timeline event

Do not infer a resend from `updated_at` when acceptance caused the update.

Short-term rule:

- suppress the resend event when `acceptedAt` equals `updatedAt` or when no distinct resend timestamp can be proven.

Tests cover initial send, revision, resend, and acceptance ordering.

### F-005 Manager terminology

Use neutral and role-aware copy:

- `Служебная панель` for shared login/shell;
- `Email` instead of `Email администратора`;
- manager dashboard text focused on orders and requests;
- admin dashboard text may retain content-management wording;
- forbidden direct routes redirect with a visible no-access notice.

### F-006 Dependencies

- Upgrade non-breaking vulnerable dev dependencies.
- Add safe package overrides for vulnerable ExcelJS transitive dependencies when compatible.
- If ExcelJS cannot be made clean safely, replace only the XLSX implementation dependency or document the residual advisory with runtime reachability evidence.
- Do not run `npm audit fix --force` blindly.

### F-007 Brief punctuation

Normalize separators before appending chips:

- remove trailing comma/semicolon whitespace;
- preserve terminal sentence punctuation cleanly;
- avoid `.,`, `,,`, and duplicates;
- keep manually entered text unchanged except the joining boundary.

### F-008 Registration errors

Replace provider/infrastructure wording with user-oriented messages. Public errors must not mention Supabase, SMTP, buckets, databases, or internal configuration.

## Testing Strategy

Use TDD for each behavior group.

Focused unit tests:

- analytics query/referrer/href sanitization;
- translation payload parsing and empty-row deletion decision;
- locale-aware public data mapping;
- page block RU/EN structure;
- timeline resend/acceptance ordering;
- brief-chip punctuation;
- public registration error copy.

Component/source contract tests:

- RU/EN controls exist on all required admin editors;
- shared fields are not duplicated incorrectly;
- manager copy and no-access notice are present.

Browser/e2e:

- RU and EN public route smoke at `1366x768`;
- no horizontal overflow;
- no Russian interface/content markers on seeded EN pages;
- admin changes EN page text and public EN page reflects it;
- admin edits EN service/package/project/tag/image text;
- all 14 live Supabase role scenarios pass without exclusions;
- claim-token is absent from analytics storage;
- cleanup returns all temporary counters to zero.

Repository verification:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- public Playwright smoke
- accessibility Playwright smoke
- full live Supabase e2e
- `npm audit --omit=dev`
- `npm audit`

## Acceptance Criteria

1. Selecting EN produces a consistently English public site for current content.
2. Admins can edit RU and EN text for all scoped public entities.
3. RU and EN unsaved form state survives language switching.
4. One save persists both languages and reload shows the saved values.
5. No claim-token or sensitive query parameter reaches analytics storage.
6. Historical claim analytics rows are removable using the supplied SQL migration.
7. Client history does not invent a resend event at acceptance time.
8. Manager login, dashboard, and forbidden-route feedback match the manager role.
9. Brief chips no longer create malformed punctuation.
10. Registration errors contain no infrastructure language.
11. The full live role suite passes without skipped scenarios caused by stale locators.
12. Dependency advisories are removed or any unavoidable residual advisory is documented with evidence.
13. Existing user changes in `src/app/account/requests/[id]/page.tsx` and `tests/request-history-copy.test.ts` are preserved.

## Delivery

Expected changed artifacts include:

- application code and focused tests;
- `supabase/migrations/<timestamp>_extend_translations_and_cleanup_analytics.sql`;
- an English translation seed/upsert SQL file if kept separate from the structural migration;
- updated `audit/audit-report.md` showing remediation status;
- verification commands and manual migration instructions.

No migration is applied to live Supabase by Codex.
