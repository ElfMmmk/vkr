create extension if not exists "pgcrypto";

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text not null,
  body text not null default '',
  blocks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  details text not null default '',
  display_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null default '',
  full_description text not null default '',
  cover_image_url text not null default '',
  display_order integer not null default 100,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_services (
  project_id uuid not null references public.projects(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (project_id, service_id)
);

create table if not exists public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url text not null default '',
  title text not null default '',
  caption text not null default '',
  parent_type text not null check (parent_type in ('project', 'page', 'service', 'free')),
  parent_id uuid,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.images add column if not exists title text not null default '';

alter table public.projects
add column if not exists cover_image_id uuid references public.images(id) on delete set null;

alter table public.projects
add column if not exists is_featured boolean not null default false;

alter table public.projects
add column if not exists display_order integer not null default 100;

create table if not exists public.project_images (
  project_id uuid not null references public.projects(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, image_id)
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  contact_method text not null,
  contact_value text not null,
  service_id uuid references public.services(id) on delete set null,
  service_title text not null default '',
  comment text not null default '',
  source_hash text not null default '',
  status text not null default 'new' check (status in ('new', 'in_progress', 'approved', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_active_order_idx on public.services (is_active, display_order);
create index if not exists projects_published_created_idx on public.projects (is_published, created_at desc);
create index if not exists projects_featured_created_idx on public.projects (is_published, is_featured desc, display_order, created_at desc);
create index if not exists projects_cover_image_idx on public.projects (cover_image_id);
create index if not exists project_services_service_idx on public.project_services (service_id);
create index if not exists project_tags_tag_idx on public.project_tags (tag_id);
create index if not exists images_parent_idx on public.images (parent_type, parent_id, sort_order);
create index if not exists project_images_project_order_idx on public.project_images (project_id, sort_order);
create index if not exists project_images_image_idx on public.project_images (image_id);
create index if not exists requests_status_created_idx on public.requests (status, created_at desc);
create index if not exists requests_service_created_idx on public.requests (service_id, created_at desc);
create index if not exists requests_source_created_idx on public.requests (source_hash, created_at desc)
where source_hash <> '';
create index if not exists requests_contact_search_idx on public.requests using gin (
  to_tsvector('simple', client_name || ' ' || contact_value)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists images_set_updated_at on public.images;
create trigger images_set_updated_at
before update on public.images
for each row execute function public.set_updated_at();

drop trigger if exists project_images_set_updated_at on public.project_images;
create trigger project_images_set_updated_at
before update on public.project_images
for each row execute function public.set_updated_at();

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

alter table public.pages enable row level security;
alter table public.services enable row level security;
alter table public.tags enable row level security;
alter table public.projects enable row level security;
alter table public.project_services enable row level security;
alter table public.project_tags enable row level security;
alter table public.images enable row level security;
alter table public.project_images enable row level security;
alter table public.requests enable row level security;

insert into public.project_images (project_id, image_id, sort_order)
select image.parent_id, image.id, image.sort_order
from public.images image
where image.parent_type = 'project'
  and image.parent_id is not null
  and exists (
    select 1
    from public.projects project
    where project.id = image.parent_id
  )
on conflict (project_id, image_id) do update
set sort_order = excluded.sort_order;

update public.projects project
set cover_image_id = image.id
from public.images image
where project.cover_image_id is null
  and project.cover_image_url <> ''
  and image.public_url = project.cover_image_url;

drop policy if exists "Public can read published pages" on public.pages;
create policy "Public can read published pages" on public.pages
for select using (true);

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services" on public.services
for select using (is_active = true);

drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags" on public.tags
for select using (true);

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects" on public.projects
for select using (is_published = true);

drop policy if exists "Public can read project services" on public.project_services;
create policy "Public can read project services" on public.project_services
for select using (
  exists (
    select 1
    from public.projects project
    where project.id = project_services.project_id
      and project.is_published = true
  )
);

drop policy if exists "Public can read project tags" on public.project_tags;
create policy "Public can read project tags" on public.project_tags
for select using (
  exists (
    select 1
    from public.projects project
    where project.id = project_tags.project_id
      and project.is_published = true
  )
);

drop policy if exists "Public can read published project images" on public.project_images;
create policy "Public can read published project images" on public.project_images
for select using (
  exists (
    select 1
    from public.projects project
    where project.id = project_images.project_id
      and project.is_published = true
  )
);

drop policy if exists "Public can read image metadata" on public.images;
create policy "Public can read image metadata" on public.images
for select using (
  exists (
    select 1
    from public.projects project
    where project.cover_image_id = images.id
      and project.is_published = true
  )
  or exists (
    select 1
    from public.project_images relation
    join public.projects project on project.id = relation.project_id
    where relation.image_id = images.id
      and project.is_published = true
  )
);

drop policy if exists "Public can submit requests" on public.requests;
create policy "Public can submit requests" on public.requests
for insert with check (status = 'new');

grant usage on schema public to anon, authenticated, service_role;

grant select on public.pages to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.tags to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant select on public.project_services to anon, authenticated;
grant select on public.project_tags to anon, authenticated;
grant select on public.project_images to anon, authenticated;
grant select on public.images to anon, authenticated;
grant insert on public.requests to anon, authenticated;

grant all privileges on public.pages to service_role;
grant all privileges on public.services to service_role;
grant all privileges on public.tags to service_role;
grant all privileges on public.projects to service_role;
grant all privileges on public.project_services to service_role;
grant all privileges on public.project_tags to service_role;
grant all privileges on public.project_images to service_role;
grant all privileges on public.images to service_role;
grant all privileges on public.requests to service_role;

-- Admin writes are performed by the server-side Supabase secret/service-role client.
-- Create a public storage bucket named `portfolio-images` in Supabase Storage.
