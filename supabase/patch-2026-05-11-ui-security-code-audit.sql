-- Safe patch for the UI/security/code audit pass.
-- Run this in Supabase SQL Editor after the previous schema/grants patch.

create extension if not exists "pgcrypto";

alter table public.images
add column if not exists title text not null default '';

alter table public.projects
add column if not exists cover_image_id uuid references public.images(id) on delete set null;

alter table public.projects
add column if not exists is_featured boolean not null default false;

create table if not exists public.project_images (
  project_id uuid not null references public.projects(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, image_id)
);

alter table public.requests
add column if not exists source_hash text not null default '';

create index if not exists projects_cover_image_idx on public.projects (cover_image_id);
create index if not exists projects_featured_created_idx on public.projects (is_published, is_featured desc, created_at desc);
create index if not exists project_images_project_order_idx on public.project_images (project_id, sort_order);
create index if not exists project_images_image_idx on public.project_images (image_id);
create index if not exists requests_source_created_idx on public.requests (source_hash, created_at desc)
where source_hash <> '';

drop trigger if exists project_images_set_updated_at on public.project_images;
create trigger project_images_set_updated_at
before update on public.project_images
for each row execute function public.set_updated_at();

alter table public.project_images enable row level security;

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

grant usage on schema public to anon, authenticated, service_role;
grant select on public.project_images to anon, authenticated;
grant all privileges on public.project_images to service_role;
