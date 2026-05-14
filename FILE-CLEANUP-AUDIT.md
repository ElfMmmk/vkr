# File cleanup audit

Date: 2026-05-14.

Checked with `git status --short --ignored`, `git ls-files`, `rg --files --hidden`, and root directory inspection. Contents of `.git/`, `node_modules/`, and `.next/` were not audited because they are Git, dependency, and build directories.

## Deleted

- `tsconfig.tsbuildinfo` - recoverable TypeScript incremental cache.
- `test-results/` - recoverable Playwright output.
- `supabase/patch-2026-05-11-ui-security-code-audit.sql` - removed by user decision; current `supabase/schema.sql` is the source of truth.
- `supabase/patch-2026-05-12-a11y-growth-features.sql` - removed by user decision; current `supabase/schema.sql` is the source of truth.
- `supabase/patch-2026-05-14-technical-audit-fixes.sql` - removed by user decision; current `supabase/schema.sql` is the source of truth.
- `.idea/` and `.vs/` - IDE-local settings, not used by app runtime, build, or tests.
- `EXECPLAN-*.md` - local ignored planning artifacts, no longer needed after implementation.
- `VKR_presentation/reference/` - presentation references removed by user decision.

## Kept

- `VKR_text/` - current VKR text materials.
- `VKR_presentation/` - current presentation and template materials.
- `VKR_presentation/template/` - presentation templates.
- `.env.local` - local Supabase credentials for live smoke/e2e; ignored by Git.
- `AGENTS.md` and `PLANS.md` - local agent/project instructions; ignored by Git.

## Git Protection

- `.gitignore` includes `/VKR_text/`, `/VKR_presentation/`, and local environment/IDE/build artifacts so VKR materials and secrets do not enter commits accidentally.
