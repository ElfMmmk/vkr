# Supabase setup

Target setup for the VKR demo:

- Supabase plan: Free.
- Region: Europe / Central EU (Frankfurt).
- Project name: `vkr-portfolio`.
- Admin email: `formaxmos@gmail.com`.

Free plan limits to keep in mind: 500 MB database, 1 GB file storage, 5 GB egress, and project pause after 1 week of inactivity.

1. Create a Supabase project using the settings above.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Run `supabase/seed.sql` for demo content.
4. Create a public Storage bucket named `portfolio-images`.
5. In Authentication, create one email/password user whose email is `formaxmos@gmail.com`.
6. Copy project URL, publishable key, and secret key into `.env.local` and later into Vercel environment variables.

For an existing project created before the reusable media/security audit, run:

```sql
-- supabase/patch-2026-05-11-ui-security-code-audit.sql
```

The patch adds reusable project media links, cover image references, featured project pinning, request throttling metadata, and stricter public read policies for project media.

Status: this patch was applied to the hosted `vkr-portfolio` Supabase project on 2026-05-12, including the `projects.display_order` column used by project drag-and-drop ordering.

Use these preferred variable names:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=formaxmos@gmail.com
```

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names are still supported as fallback. The app uses the secret key only in server-side code. Do not expose it in browser code or commit real credentials.

Create `portfolio-images` as a public bucket for demo portfolio media. The app enforces a 10 MB per-image upload limit and accepts JPEG, PNG, WebP, GIF, and AVIF. Do not enable paid Storage Image Transformations for the Free plan demo.
