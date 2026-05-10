# Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Run `supabase/seed.sql` for demo content.
4. Create a public Storage bucket named `portfolio-images`.
5. In Authentication, create one user whose email matches `ADMIN_EMAIL`.
6. Copy project URL, anon key, and service role key into `.env.local` and Vercel environment variables.

The app uses the service-role key only in server-side code. Do not expose it in browser code or commit real credentials.
