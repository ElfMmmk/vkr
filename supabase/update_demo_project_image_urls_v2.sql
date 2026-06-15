begin;

do $$
declare
  item record;
  project_record public.projects%rowtype;
  v_cover_image_id uuid;
  v_gallery_image_id uuid;
begin
  for item in
    select *
    from (values
      ('north-coffee-roasters', 'north-coffee-cover-v2.png', 'north-coffee-gallery-1-v2.png'),
      ('botanica-lab', 'botanica-cover-v2.png', 'botanica-gallery-1-v2.png'),
      ('studio-frame', 'studio-frame-cover-v2.png', 'studio-frame-gallery-1-v2.png'),
      ('urban-forum-deck', 'urban-forum-cover-v2.png', 'urban-forum-gallery-1-v2.png'),
      ('atelier-nord', 'atelier-nord-cover-v2.png', 'atelier-nord-gallery-1-v2.png'),
      ('lumen-skincare', 'lumen-skincare-cover-v2.png', 'lumen-skincare-gallery-1-v2.png'),
      ('mellow-bakery', 'mellow-bakery-cover-v2.png', 'mellow-bakery-gallery-1-v2.png'),
      ('vector-summit', 'vector-summit-cover-v2.png', 'vector-summit-gallery-1-v2.png'),
      ('arc-habitat', 'arc-habitat-cover-v2.png', 'arc-habitat-gallery-1-v2.png'),
      ('terra-market', 'terra-market-cover-v2.png', 'terra-market-gallery-1-v2.png')
    ) as mapping(slug, cover_file, gallery_file)
  loop
    select * into project_record
    from public.projects
    where slug = item.slug;

    if not found then
      raise exception 'Demo project not found: %', item.slug;
    end if;

    select id into v_cover_image_id
    from public.images
    where parent_type = 'project'
      and parent_id = project_record.id
      and storage_path = 'demo-projects/' || item.cover_file
    order by created_at, id
    limit 1;

    if v_cover_image_id is null then
      update public.images
      set storage_path = 'demo-projects/' || item.cover_file,
          public_url = '/assets/demo-projects/' || item.cover_file,
          sort_order = 10,
          updated_at = now()
      where id = (
        select id
        from public.images
        where parent_type = 'project'
          and parent_id = project_record.id
          and storage_path = replace('demo-projects/' || item.cover_file, '-v2.png', '.png')
        order by created_at, id
        limit 1
      )
      returning id into v_cover_image_id;
    end if;

    if v_cover_image_id is null then
      insert into public.images (
        storage_path, public_url, title, caption, parent_type, parent_id, sort_order
      ) values (
        'demo-projects/' || item.cover_file,
        '/assets/demo-projects/' || item.cover_file,
        project_record.title,
        'Обложка проекта ' || project_record.title,
        'project',
        project_record.id,
        10
      ) returning id into v_cover_image_id;
    end if;

    select id into v_gallery_image_id
    from public.images
    where parent_type = 'project'
      and parent_id = project_record.id
      and storage_path = 'demo-projects/' || item.gallery_file
    order by created_at, id
    limit 1;

    if v_gallery_image_id is null then
      update public.images
      set storage_path = 'demo-projects/' || item.gallery_file,
          public_url = '/assets/demo-projects/' || item.gallery_file,
          sort_order = 20,
          updated_at = now()
      where id = (
        select id
        from public.images
        where parent_type = 'project'
          and parent_id = project_record.id
          and storage_path = replace('demo-projects/' || item.gallery_file, '-v2.png', '.png')
        order by created_at, id
        limit 1
      )
      returning id into v_gallery_image_id;
    end if;

    if v_gallery_image_id is null then
      insert into public.images (
        storage_path, public_url, title, caption, parent_type, parent_id, sort_order
      ) values (
        'demo-projects/' || item.gallery_file,
        '/assets/demo-projects/' || item.gallery_file,
        project_record.title,
        'Материал проекта ' || project_record.title,
        'project',
        project_record.id,
        20
      ) returning id into v_gallery_image_id;
    end if;

    update public.projects
    set cover_image_url = '/assets/demo-projects/' || item.cover_file,
        cover_image_id = v_cover_image_id,
        updated_at = now()
    where id = project_record.id;

    delete from public.project_images
    where project_id = project_record.id;

    insert into public.project_images (project_id, image_id, sort_order)
    values (project_record.id, v_gallery_image_id, 10);

    delete from public.images
    where parent_type = 'project'
      and parent_id = project_record.id
      and id not in (v_cover_image_id, v_gallery_image_id)
      and storage_path in (
        replace('demo-projects/' || item.cover_file, '-v2.png', '.png'),
        replace('demo-projects/' || item.gallery_file, '-v2.png', '.png'),
        'demo-projects/' || item.cover_file,
        'demo-projects/' || item.gallery_file
      );
  end loop;
end
$$;

commit;

select
  project.slug,
  project.cover_image_url,
  cover.public_url as cover_public_url,
  gallery.public_url as gallery_public_url
from public.projects project
left join public.images cover on cover.id = project.cover_image_id
left join public.project_images relation on relation.project_id = project.id
left join public.images gallery on gallery.id = relation.image_id
where project.slug in (
  'north-coffee-roasters',
  'botanica-lab',
  'studio-frame',
  'urban-forum-deck',
  'atelier-nord',
  'lumen-skincare',
  'mellow-bakery',
  'vector-summit',
  'arc-habitat',
  'terra-market'
)
order by project.display_order, project.slug;
