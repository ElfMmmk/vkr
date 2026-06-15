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

create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  title text not null,
  description text not null default '',
  badge text not null default '',
  best_for text not null default '',
  outcome text not null default '',
  included_items text[] not null default '{}'::text[],
  price_from integer not null default 0 check (price_from >= 0),
  price_to integer not null default 0 check (price_to >= price_from),
  duration_from_days integer not null default 1 check (duration_from_days >= 1),
  duration_to_days integer not null default 1 check (duration_to_days >= duration_from_days),
  display_order integer not null default 100,
  is_active boolean not null default true,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_addons (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  title text not null,
  description text not null default '',
  price integer not null default 0 check (price >= 0),
  duration_days integer not null default 0 check (duration_days >= 0),
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
  package_id uuid references public.service_packages(id) on delete set null,
  package_title text not null default '',
  package_description text not null default '',
  package_price_from integer,
  package_price_to integer,
  package_duration_from_days integer,
  package_duration_to_days integer,
  selected_addons jsonb not null default '[]'::jsonb,
  reference_project_id uuid references public.projects(id) on delete set null,
  reference_project_title text not null default '',
  reference_project_slug text not null default '',
  result_description text not null default '',
  style_preferences text not null default '',
  materials text not null default '',
  desired_deadline text not null default '',
  estimated_price_from integer,
  estimated_price_to integer,
  estimated_duration_from_days integer,
  estimated_duration_to_days integer,
  comment text not null default '',
  client_user_id uuid references auth.users(id) on delete set null,
  source_hash text not null default '',
  status text not null default 'new' check (status in ('new', 'in_progress', 'approved', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_contracts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  final_price integer not null default 0 check (final_price >= 0),
  final_duration_days integer not null default 1 check (final_duration_days >= 1),
  work_scope text not null default '',
  materials text not null default '',
  manager_comment text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent', 'revision_requested', 'accepted', 'cancelled')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.order_contracts
drop constraint if exists order_contracts_status_check;
alter table public.order_contracts
add constraint order_contracts_status_check
check (status in ('draft', 'sent', 'revision_requested', 'accepted', 'cancelled'));

create table if not exists public.order_contract_feedback (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.order_contracts(id) on delete cascade,
  request_id uuid not null references public.requests(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete set null,
  author_role text not null default 'client' check (author_role in ('client', 'manager', 'admin')),
  message text not null check (char_length(message) between 10 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.order_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  size integer not null check (size >= 0 and size <= 10485760),
  created_at timestamptz not null default now()
);

create table if not exists public.request_claim_tokens (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Existing hosted projects can already have `requests` from older schema versions.
-- Add order workflow columns before indexes, triggers, and policies reference them.
alter table public.requests
add column if not exists client_user_id uuid references auth.users(id) on delete set null;

alter table public.requests
add column if not exists package_id uuid references public.service_packages(id) on delete set null;

alter table public.requests
add column if not exists package_title text not null default '';

alter table public.requests
add column if not exists package_description text not null default '';

alter table public.requests
add column if not exists package_price_from integer;

alter table public.requests
add column if not exists package_price_to integer;

alter table public.requests
add column if not exists package_duration_from_days integer;

alter table public.requests
add column if not exists package_duration_to_days integer;

alter table public.requests
add column if not exists selected_addons jsonb not null default '[]'::jsonb;

alter table public.requests
add column if not exists reference_project_id uuid references public.projects(id) on delete set null;

alter table public.requests
add column if not exists reference_project_title text not null default '';

alter table public.requests
add column if not exists reference_project_slug text not null default '';

alter table public.requests
add column if not exists result_description text not null default '';

alter table public.requests
add column if not exists style_preferences text not null default '';

alter table public.requests
add column if not exists materials text not null default '';

alter table public.requests
add column if not exists desired_deadline text not null default '';

alter table public.requests
add column if not exists estimated_price_from integer;

alter table public.requests
add column if not exists estimated_price_to integer;

alter table public.requests
add column if not exists estimated_duration_from_days integer;

alter table public.requests
add column if not exists estimated_duration_to_days integer;

alter table public.service_packages
add column if not exists badge text not null default '';

alter table public.service_packages
add column if not exists best_for text not null default '';

alter table public.service_packages
add column if not exists outcome text not null default '';

alter table public.service_packages
add column if not exists included_items text[] not null default '{}'::text[];

alter table public.service_packages
add column if not exists is_recommended boolean not null default false;

create index if not exists services_active_order_idx on public.services (is_active, display_order);
create index if not exists service_packages_service_order_idx on public.service_packages (service_id, is_active, display_order);
create index if not exists service_addons_service_order_idx on public.service_addons (service_id, is_active, display_order);
create index if not exists projects_published_created_idx on public.projects (is_published, created_at desc);
create index if not exists projects_featured_created_idx on public.projects (is_published, is_featured desc, display_order, created_at desc);
create index if not exists projects_cover_image_idx on public.projects (cover_image_id);
create index if not exists project_services_service_idx on public.project_services (service_id);
create index if not exists project_tags_tag_idx on public.project_tags (tag_id);
create index if not exists images_parent_idx on public.images (parent_type, parent_id, sort_order);
create index if not exists analytics_events_type_created_idx on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_events_path_created_idx on public.analytics_events (path, created_at desc);
create index if not exists analytics_events_source_created_idx on public.analytics_events (source_hash, created_at desc)
where source_hash <> '';
create index if not exists project_images_project_order_idx on public.project_images (project_id, sort_order);
create index if not exists project_images_image_idx on public.project_images (image_id);
create index if not exists requests_status_created_idx on public.requests (status, created_at desc);
create index if not exists requests_service_created_idx on public.requests (service_id, created_at desc);
create index if not exists requests_package_created_idx on public.requests (package_id, created_at desc);
create index if not exists requests_reference_project_idx on public.requests (reference_project_id);
create index if not exists requests_source_created_idx on public.requests (source_hash, created_at desc)
where source_hash <> '';
create index if not exists requests_contact_search_idx on public.requests using gin (
  to_tsvector('simple', client_name || ' ' || contact_value)
);
create index if not exists order_contracts_request_idx on public.order_contracts (request_id);
create index if not exists order_contracts_status_created_idx on public.order_contracts (status, created_at desc);
create index if not exists order_contract_feedback_contract_created_idx on public.order_contract_feedback (contract_id, created_at);
create index if not exists order_attachments_request_created_idx on public.order_attachments (request_id, created_at desc);
create index if not exists order_attachments_client_created_idx on public.order_attachments (client_user_id, created_at desc);
create index if not exists request_claim_tokens_hash_idx on public.request_claim_tokens (token_hash);
create index if not exists request_claim_tokens_request_idx on public.request_claim_tokens (request_id);

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

drop trigger if exists service_packages_set_updated_at on public.service_packages;
create trigger service_packages_set_updated_at
before update on public.service_packages
for each row execute function public.set_updated_at();

drop trigger if exists service_addons_set_updated_at on public.service_addons;
create trigger service_addons_set_updated_at
before update on public.service_addons
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

drop trigger if exists order_contracts_set_updated_at on public.order_contracts;
create trigger order_contracts_set_updated_at
before update on public.order_contracts
for each row execute function public.set_updated_at();

alter table public.pages enable row level security;
alter table public.services enable row level security;
alter table public.service_packages enable row level security;
alter table public.service_addons enable row level security;
alter table public.tags enable row level security;
alter table public.projects enable row level security;
alter table public.project_services enable row level security;
alter table public.project_tags enable row level security;
alter table public.images enable row level security;
alter table public.analytics_events enable row level security;
alter table public.project_images enable row level security;
alter table public.requests enable row level security;
alter table public.order_contracts enable row level security;
alter table public.order_contract_feedback enable row level security;
alter table public.order_attachments enable row level security;
alter table public.request_claim_tokens enable row level security;

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

drop policy if exists "Public can read active service packages" on public.service_packages;
create policy "Public can read active service packages" on public.service_packages
for select using (
  is_active = true
  and exists (
    select 1
    from public.services service
    where service.id = service_packages.service_id
      and service.is_active = true
  )
);

drop policy if exists "Public can read active service addons" on public.service_addons;
create policy "Public can read active service addons" on public.service_addons
for select using (
  is_active = true
  and exists (
    select 1
    from public.services service
    where service.id = service_addons.service_id
      and service.is_active = true
  )
);

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
drop policy if exists "Anon can submit requests" on public.requests;
drop policy if exists "Authenticated clients can submit own requests" on public.requests;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.pages to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select on public.service_packages to anon, authenticated;
grant select on public.service_addons to anon, authenticated;
grant select on public.tags to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant select on public.project_services to anon, authenticated;
grant select on public.project_tags to anon, authenticated;
grant select on public.project_images to anon, authenticated;
grant select on public.images to anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;
revoke insert on public.requests from anon, authenticated;

grant all privileges on public.pages to service_role;
grant all privileges on public.services to service_role;
grant all privileges on public.service_packages to service_role;
grant all privileges on public.service_addons to service_role;
grant all privileges on public.tags to service_role;
grant all privileges on public.projects to service_role;
grant all privileges on public.project_services to service_role;
grant all privileges on public.project_tags to service_role;
grant all privileges on public.project_images to service_role;
grant all privileges on public.images to service_role;
grant all privileges on public.analytics_events to service_role;
grant all privileges on public.requests to service_role;
grant all privileges on public.order_contracts to service_role;
grant all privileges on public.order_attachments to service_role;
grant all privileges on public.request_claim_tokens to service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'client' check (role in ('admin', 'manager', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop policy if exists "Clients can read own order contracts" on public.order_contracts;
create policy "Clients can read own order contracts" on public.order_contracts
for select to authenticated
using (
  status in ('sent', 'revision_requested', 'accepted')
  and exists (
    select 1
    from public.requests request
    where request.id = order_contracts.request_id
      and request.client_user_id = auth.uid()
  )
);

alter table public.notifications
drop constraint if exists notifications_type_check;
alter table public.notifications
add constraint notifications_type_check
check (type in ('request_created', 'request_status_changed', 'contract_revision_requested', 'system'));

drop policy if exists "Clients can read own contract feedback" on public.order_contract_feedback;
create policy "Clients can read own contract feedback" on public.order_contract_feedback
for select to authenticated
using (
  exists (
    select 1
    from public.requests request
    where request.id = order_contract_feedback.request_id
      and request.client_user_id = auth.uid()
  )
);

create or replace function public.request_order_contract_revision(
  target_contract_id uuid,
  feedback_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_request_id uuid;
  feedback_id uuid;
begin
  if char_length(trim(feedback_message)) not between 10 and 1000 then
    raise exception 'Feedback must contain between 10 and 1000 characters';
  end if;

  select request.id into target_request_id
  from public.order_contracts contract
  join public.requests request on request.id = contract.request_id
  where contract.id = target_contract_id
    and contract.status = 'sent'
    and request.client_user_id = auth.uid()
  for update of contract;

  if target_request_id is null then
    raise exception 'Contract is unavailable for revision';
  end if;

  insert into public.order_contract_feedback (contract_id, request_id, client_user_id, author_role, message)
  values (target_contract_id, target_request_id, auth.uid(), 'client', trim(feedback_message))
  returning id into feedback_id;

  update public.order_contracts set status = 'revision_requested', accepted_at = null
  where id = target_contract_id;

  insert into public.notifications (type, title, body, entity_type, entity_id, audience_role)
  values ('contract_revision_requested', 'Клиент запросил изменения', trim(feedback_message), 'request', target_request_id, 'manager');

  return feedback_id;
end;
$$;

revoke all on function public.request_order_contract_revision(uuid, text) from public, anon;
grant execute on function public.request_order_contract_revision(uuid, text) to authenticated;

drop policy if exists "Clients can read own order attachments" on public.order_attachments;
create policy "Clients can read own order attachments" on public.order_attachments
for select to authenticated
using (
  exists (
    select 1
    from public.requests request
    where request.id = order_attachments.request_id
      and request.client_user_id = auth.uid()
  )
);

drop policy if exists "Public can read public translations" on public.entity_translations;
create policy "Public can read public translations" on public.entity_translations
for select using (is_public = true);

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.entity_translations to anon, authenticated;
grant select on public.requests to authenticated;
revoke insert on public.requests from anon, authenticated;
grant select on public.order_contracts to authenticated;
grant select on public.order_contract_feedback to authenticated;
revoke all on public.order_attachments from anon, authenticated;
grant select on public.order_attachments to authenticated;
revoke all on public.request_claim_tokens from anon, authenticated;

grant all privileges on public.profiles to service_role;
grant all privileges on public.request_status_history to service_role;
grant all privileges on public.notifications to service_role;
grant all privileges on public.notification_reads to service_role;
grant all privileges on public.entity_translations to service_role;
grant all privileges on public.order_attachments to service_role;
grant all privileges on public.order_contract_feedback to service_role;
grant all privileges on public.request_claim_tokens to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  10485760,
  array['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-attachments',
  'order-attachments',
  false,
  10485760,
  array[
    'application/msword',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Admin writes are performed by the server-side Supabase secret/service-role client.
-- Public users can read objects from the public `portfolio-images` bucket but cannot write to it.
