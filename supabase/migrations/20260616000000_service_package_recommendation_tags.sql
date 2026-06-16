alter table public.service_packages
add column if not exists recommendation_tags jsonb not null default '{}'::jsonb;

alter table public.service_packages
drop constraint if exists service_packages_recommendation_tags_object_check;

alter table public.service_packages
add constraint service_packages_recommendation_tags_object_check
check (jsonb_typeof(recommendation_tags) = 'object');
