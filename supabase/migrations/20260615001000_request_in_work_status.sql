alter table public.requests
drop constraint if exists requests_status_check;

alter table public.requests
add constraint requests_status_check
check (status in ('new', 'in_progress', 'approved', 'in_work', 'completed', 'rejected'));

alter table public.request_status_history
drop constraint if exists request_status_history_to_status_check;

alter table public.request_status_history
add constraint request_status_history_to_status_check
check (to_status in ('new', 'in_progress', 'approved', 'in_work', 'completed', 'rejected'));
