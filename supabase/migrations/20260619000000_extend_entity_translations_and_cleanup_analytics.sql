alter table public.entity_translations
drop constraint if exists entity_translations_entity_type_check;

alter table public.entity_translations
add constraint entity_translations_entity_type_check
check (
  entity_type in ('page', 'service', 'service_package', 'service_addon', 'project', 'tag', 'image')
);

create or replace function public.delete_entity_translations_for_row()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  delete from public.entity_translations
  where entity_type = tg_argv[0]
    and entity_id = old.id;

  return old;
end;
$$;

drop trigger if exists pages_delete_entity_translations on public.pages;
create trigger pages_delete_entity_translations
after delete on public.pages
for each row execute function public.delete_entity_translations_for_row('page');

drop trigger if exists services_delete_entity_translations on public.services;
create trigger services_delete_entity_translations
after delete on public.services
for each row execute function public.delete_entity_translations_for_row('service');

drop trigger if exists service_packages_delete_entity_translations on public.service_packages;
create trigger service_packages_delete_entity_translations
after delete on public.service_packages
for each row execute function public.delete_entity_translations_for_row('service_package');

drop trigger if exists service_addons_delete_entity_translations on public.service_addons;
create trigger service_addons_delete_entity_translations
after delete on public.service_addons
for each row execute function public.delete_entity_translations_for_row('service_addon');

drop trigger if exists projects_delete_entity_translations on public.projects;
create trigger projects_delete_entity_translations
after delete on public.projects
for each row execute function public.delete_entity_translations_for_row('project');

drop trigger if exists tags_delete_entity_translations on public.tags;
create trigger tags_delete_entity_translations
after delete on public.tags
for each row execute function public.delete_entity_translations_for_row('tag');

drop trigger if exists images_delete_entity_translations on public.images;
create trigger images_delete_entity_translations
after delete on public.images
for each row execute function public.delete_entity_translations_for_row('image');

delete from public.analytics_events
where coalesce(search, '') ~* '(^|[?&])claim='
   or coalesce(href, '') ~* '(^|[?&])claim='
   or coalesce(referrer, '') ~* '(^|[?&])claim=';
