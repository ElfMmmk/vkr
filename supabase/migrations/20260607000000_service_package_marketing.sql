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
