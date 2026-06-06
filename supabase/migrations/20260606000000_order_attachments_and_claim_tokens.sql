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

create index if not exists order_attachments_request_created_idx
on public.order_attachments (request_id, created_at desc);

create index if not exists order_attachments_client_created_idx
on public.order_attachments (client_user_id, created_at desc);

create index if not exists request_claim_tokens_hash_idx
on public.request_claim_tokens (token_hash);

create index if not exists request_claim_tokens_request_idx
on public.request_claim_tokens (request_id);

alter table public.order_attachments enable row level security;
alter table public.request_claim_tokens enable row level security;

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

revoke all on public.order_attachments from anon, authenticated;
grant select on public.order_attachments to authenticated;

revoke all on public.request_claim_tokens from anon, authenticated;

grant all privileges on public.order_attachments to service_role;
grant all privileges on public.request_claim_tokens to service_role;

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
