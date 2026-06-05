create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'cta_click')),
  path text not null,
  search text not null default '',
  referrer text not null default '',
  href text not null default '',
  label text not null default '',
  source_hash text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_type_created_idx
on public.analytics_events (event_type, created_at desc);

create index if not exists analytics_events_path_created_idx
on public.analytics_events (path, created_at desc);

create index if not exists analytics_events_source_created_idx
on public.analytics_events (source_hash, created_at desc)
where source_hash <> '';

alter table public.analytics_events enable row level security;

revoke all on public.analytics_events from anon, authenticated;
grant all privileges on public.analytics_events to service_role;
