-- Growth feature patch for stable-version 1.3 planning branch.
-- Apply in the hosted Supabase SQL editor before testing roles, client accounts,
-- notifications, analytics, translations, and request export against production data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'client' check (role in ('admin', 'manager', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.requests
add column if not exists client_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('new', 'in_progress', 'approved', 'completed', 'rejected')),
  changed_by_user_id uuid references auth.users(id) on delete set null,
  changed_by_role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('request_created', 'request_status_changed', 'system')),
  title text not null,
  body text not null default '',
  entity_type text not null default '',
  entity_id uuid,
  audience_role text not null default 'manager' check (audience_role in ('admin', 'manager')),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create table if not exists public.entity_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('page', 'service', 'tag', 'project', 'image')),
  entity_id uuid not null,
  locale text not null check (locale in ('ru', 'en')),
  fields jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, locale)
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists requests_client_user_created_idx on public.requests (client_user_id, created_at desc);
create index if not exists request_status_history_request_idx on public.request_status_history (request_id, created_at desc);
create index if not exists notifications_created_idx on public.notifications (created_at desc);
create index if not exists notifications_audience_created_idx on public.notifications (audience_role, created_at desc);
create index if not exists entity_translations_lookup_idx on public.entity_translations (entity_type, entity_id, locale);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists entity_translations_set_updated_at on public.entity_translations;
create trigger entity_translations_set_updated_at
before update on public.entity_translations
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.request_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.entity_translations enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "Users can update own profile name" on public.profiles;
create policy "Users can update own profile name" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id and role = (select role from public.profiles current_profile where current_profile.id = auth.uid()));

drop policy if exists "Clients can read own requests" on public.requests;
create policy "Clients can read own requests" on public.requests
for select using (auth.uid() = client_user_id);

drop policy if exists "Authenticated clients can submit own requests" on public.requests;
create policy "Authenticated clients can submit own requests" on public.requests
for insert with check (status = 'new' and (client_user_id is null or client_user_id = auth.uid()));

drop policy if exists "Public can read public translations" on public.entity_translations;
create policy "Public can read public translations" on public.entity_translations
for select using (is_public = true);

grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.profiles to authenticated;
grant select on public.entity_translations to anon, authenticated;
grant select, insert on public.requests to authenticated;

grant all privileges on public.profiles to service_role;
grant all privileges on public.request_status_history to service_role;
grant all privileges on public.notifications to service_role;
grant all privileges on public.notification_reads to service_role;
grant all privileges on public.entity_translations to service_role;
