alter table public.order_contracts
drop constraint if exists order_contracts_status_check;

alter table public.order_contracts
add constraint order_contracts_status_check
check (status in ('draft', 'sent', 'revision_requested', 'accepted', 'cancelled'));

alter table public.notifications
drop constraint if exists notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (type in ('request_created', 'request_status_changed', 'contract_revision_requested', 'system'));

create table if not exists public.order_contract_feedback (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.order_contracts(id) on delete cascade,
  request_id uuid not null references public.requests(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete set null,
  author_role text not null default 'client' check (author_role in ('client', 'manager', 'admin')),
  message text not null check (char_length(message) between 10 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists order_contract_feedback_contract_created_idx
on public.order_contract_feedback (contract_id, created_at);

alter table public.order_contract_feedback enable row level security;

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

  select request.id
  into target_request_id
  from public.order_contracts contract
  join public.requests request on request.id = contract.request_id
  where contract.id = target_contract_id
    and contract.status = 'sent'
    and request.client_user_id = auth.uid()
  for update of contract;

  if target_request_id is null then
    raise exception 'Contract is unavailable for revision';
  end if;

  insert into public.order_contract_feedback (
    contract_id,
    request_id,
    client_user_id,
    author_role,
    message
  )
  values (
    target_contract_id,
    target_request_id,
    auth.uid(),
    'client',
    trim(feedback_message)
  )
  returning id into feedback_id;

  update public.order_contracts
  set status = 'revision_requested',
      accepted_at = null
  where id = target_contract_id;

  insert into public.notifications (
    type,
    title,
    body,
    entity_type,
    entity_id,
    audience_role
  )
  values (
    'contract_revision_requested',
    'Клиент запросил изменения',
    trim(feedback_message),
    'request',
    target_request_id,
    'manager'
  );

  return feedback_id;
end;
$$;

revoke all on function public.request_order_contract_revision(uuid, text) from public, anon;
grant execute on function public.request_order_contract_revision(uuid, text) to authenticated;

grant select on public.order_contract_feedback to authenticated;
grant all privileges on public.order_contract_feedback to service_role;
