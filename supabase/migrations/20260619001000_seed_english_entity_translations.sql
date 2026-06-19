with page_values(page_key, fields) as (
  values
    (
      'home',
      jsonb_build_object(
        'title', 'Graphic design that helps brands communicate clearly',
        'body', 'A designer portfolio focused on identity, packaging, digital materials, and presentations. Every project starts with the business goal and visual clarity.',
        'blocks', jsonb_build_object('cta', 'Discuss a project', 'secondaryCta', 'View portfolio')
      )
    ),
    (
      'about',
      jsonb_build_object(
        'title', 'About the designer',
        'body', 'I help small businesses, experts, and creative teams turn ideas into coherent visual systems, from logos and brand assets to presentations, social media, and print.',
        'blocks', jsonb_build_object(
          'experience', '5+ years in branding and commercial design',
          'focus', 'identity, packaging, digital, editorial'
        )
      )
    ),
    (
      'services',
      jsonb_build_object(
        'title', 'Services',
        'body', 'Choose a focused task or build a complete package for a product launch, event, or brand refresh.',
        'blocks', '{}'::jsonb
      )
    ),
    (
      'contacts',
      jsonb_build_object(
        'title', 'Contacts',
        'body', 'Send a project request through the form or contact me directly. I usually reply within one business day.',
        'blocks', jsonb_build_object('email', 'designer@example.com', 'telegram', '@portfolio_contact')
      )
    )
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select 'page', page.id, 'en', page_values.fields, true
from page_values
join public.pages page on page.page_key = page_values.page_key
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();

with service_values(slug, title, description, details) as (
  values
    ('brand-identity', 'Brand identity', 'Logo, visual identity, and clear rules for brand communication.', 'From a core mark to a complete asset system and practical usage guide.'),
    ('social-media', 'Social media design', 'A visual system for posts, covers, stories, and campaign assets.', 'Reusable templates help teams publish consistently without losing the brand style.'),
    ('packaging-print', 'Packaging and print', 'Packaging, labels, and print materials prepared for production.', 'Layouts follow the technical requirements of the selected printer or manufacturer.'),
    ('presentation-design', 'Presentations', 'Structure and visual design for sales, reports, and expert talks.', 'The work covers visual logic, pacing, hierarchy, and emphasis.'),
    ('web-design', 'Web design', 'Prototype and visual design for a website or digital product.', 'Layouts are prepared for development and include the key interface states.')
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select
  'service',
  service.id,
  'en',
  jsonb_build_object(
    'title', service_values.title,
    'description', service_values.description,
    'details', service_values.details
  ),
  true
from service_values
join public.services service on service.slug = service_values.slug
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();

with tag_values(slug, title, description) as (
  values
    ('branding', 'Branding', 'Projects with a complete brand identity system'),
    ('digital', 'Digital', 'Materials for online communication'),
    ('print', 'Print', 'Print and packaging materials'),
    ('minimal', 'Minimal', 'Restrained visual direction')
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select
  'tag',
  tag.id,
  'en',
  jsonb_build_object('title', tag_values.title, 'description', tag_values.description),
  true
from tag_values
join public.tags tag on tag.slug = tag_values.slug
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();

with project_values(slug, title, short_description, full_description) as (
  values
    ('north-coffee-roasters', 'North Coffee Roasters', 'Packaging and print system for a specialty coffee roaster.', 'The coffee line uses color-coded packaging for flavor navigation together with a coordinated set of point-of-sale materials.'),
    ('botanica-lab', 'Botanica Lab', 'Identity and packaging for a natural skincare line.', 'The visual system combines laboratory precision with a soft natural aesthetic across packaging and communication materials.'),
    ('studio-frame', 'Studio Frame', 'A digital announcement and social media system for a photo studio.', 'A modular grid and reusable templates let the team publish regularly while keeping the visual identity consistent.'),
    ('urban-forum-deck', 'Urban Forum Deck', 'Presentation design for an urban education forum.', 'The slides follow a clear speaking narrative and combine large typography, maps, and structured information blocks.'),
    ('atelier-nord', 'Atelier Nord', 'Restrained identity for an architecture studio.', 'The mark, typography, and business materials create a calm and professional image for the architecture practice.'),
    ('lumen-skincare', 'Lumen Skincare', 'Packaging and a landing page for a skincare line.', 'The project combines tactile packaging, a calm palette, and a digital presentation of the product range.'),
    ('mellow-bakery', 'Mellow Bakery', 'Warm packaging and social media design for an urban bakery.', 'The system covers bakery packaging, seasonal materials, and publication templates in one friendly visual language.'),
    ('vector-summit', 'Vector Summit', 'Identity and presentation system for a technology conference.', 'High-contrast graphics connect posters, digital announcements, and speaker presentation templates.'),
    ('arc-habitat', 'Arc Habitat', 'Corporate website and sales materials for a residential project.', 'The web system presents architecture, layouts, and project benefits through large imagery and clear navigation.'),
    ('terra-market', 'Terra Market', 'Identity and packaging for a local grocery store.', 'A flexible label and print system brings products from different makers together under one store brand.')
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select
  'project',
  project.id,
  'en',
  jsonb_build_object(
    'title', project_values.title,
    'shortDescription', project_values.short_description,
    'fullDescription', project_values.full_description
  ),
  true
from project_values
join public.projects project on project.slug = project_values.slug
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();

with package_values(
  service_slug,
  source_title,
  title,
  description,
  badge,
  best_for,
  outcome,
  included_items
) as (
  values
    ('brand-identity', 'Логотип', 'Logo', 'Logo mark, color palette, and essential usage versions.', 'Start', 'A new project that needs a recognizable visual mark', 'A launch-ready logo and core file set', array['Logo', 'Color palette', 'Print and screen files']),
    ('brand-identity', 'Фирменный стиль', 'Visual identity', 'Logo, typography, color palette, and key brand assets.', 'Recommended', 'Launching or refreshing a company image', 'A ready identity for the main customer touchpoints', array['Logo', 'Typography', 'Brand assets', 'Short guide']),
    ('brand-identity', 'Бренд-система', 'Brand system', 'An extended identity system with rules and reusable layouts.', 'Complete', 'A brand with several products and communication channels', 'A scalable visual system', array['Identity', 'Brand guide', 'Templates', 'Asset system']),
    ('social-media', 'Старт', 'Starter', 'Profile styling and a set of launch-ready publications.', 'Basic', 'Launching or carefully refreshing a profile', 'A polished profile and the first ready-to-publish materials', array['Avatar', 'Covers', '6 post templates']),
    ('social-media', 'Контент-система', 'Content system', 'A modular grid and templates for recurring content formats.', 'Recommended', 'Regular content across several formats', 'A flexible system for preparing publications in-house', array['Grid', '12 templates', 'Covers', 'Guide']),
    ('social-media', 'Сопровождение на месяц', 'One-month support', 'Publication design and format adaptations throughout one month.', 'Support', 'A team that needs regular design support', 'A complete month of visual content', array['Up to 20 posts', 'Stories', 'Covers', 'Adaptations']),
    ('packaging-print', 'Один носитель', 'Single item', 'Design for one package, label, or print item.', 'One task', 'A single product or promotional item', 'A production-ready layout', array['Concept', 'Layout', 'Prepress preparation']),
    ('packaging-print', 'Линейка', 'Product line', 'A packaging system for several flavors or product variants.', 'Recommended', 'A family of related products', 'One visual system and a production file set', array['Packaging system', 'Up to 4 variants', 'Production files']),
    ('packaging-print', 'Комплекс', 'Complete set', 'Packaging, labels, and supporting printed materials.', 'Complete', 'A product launch with several customer touchpoints', 'A full packaging and print material set', array['Packaging', 'Labels', 'Inserts', 'POS materials']),
    ('presentation-design', 'До 10 слайдов', 'Up to 10 slides', 'A concise deck for a talk, pitch, or proposal.', 'Short format', 'A pitch, meeting, or short presentation', 'A ready presentation of up to 10 slides', array['Structure', 'Design', 'Final file']),
    ('presentation-design', 'До 20 слайдов', 'Up to 20 slides', 'A detailed deck with diagrams and strong visual emphasis.', 'Recommended', 'Sales, reporting, or an expert presentation', 'A coherent presentation of up to 20 slides', array['Structure', 'Design', 'Diagrams', 'Final file']),
    ('presentation-design', 'Шаблон и система', 'Template system', 'A presentation plus an editable master-slide system for the team.', 'For teams', 'Regular in-house presentation production', 'A template, slide library, and usage rules', array['Master slides', 'Block library', 'Example deck', 'Guide']),
    ('web-design', 'Лендинг', 'Landing page', 'A single-page website with key sections and responsive states.', 'Fast launch', 'A service, product, or event with one primary goal', 'A development-ready landing page design', array['Prototype', 'Design', 'Mobile version', 'UI kit']),
    ('web-design', 'Корпоративный сайт', 'Corporate website', 'A multi-page company website with a shared component system.', 'Recommended', 'A company with several services and content sections', 'A system of key page layouts and responsive versions', array['Prototype', 'Up to 8 pages', 'Responsive layouts', 'UI kit']),
    ('web-design', 'Интерфейс продукта', 'Product interface', 'User flows and interface design for a web service or account area.', 'Product', 'A digital service with an account area and complex flows', 'A prototype and design for the key product scenarios', array['User flows', 'Prototype', 'Interface', 'Components'])
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select
  'service_package',
  package.id,
  'en',
  jsonb_build_object(
    'title', package_values.title,
    'description', package_values.description,
    'badge', package_values.badge,
    'bestFor', package_values.best_for,
    'outcome', package_values.outcome,
    'includedItems', to_jsonb(package_values.included_items)
  ),
  true
from package_values
join public.services service on service.slug = package_values.service_slug
join public.service_packages package
  on package.service_id = service.id
 and package.title = package_values.source_title
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();

with addon_values(service_slug, source_title, title, description) as (
  values
    ('brand-identity', 'Подбор названия', 'Naming', 'Name directions reviewed for meaning, sound, and visual potential.'),
    ('brand-identity', 'Шаблоны для команды', 'Team templates', 'Editable templates for documents and publications.'),
    ('social-media', 'Рекламные креативы', 'Ad creatives', 'Additional formats for advertising campaigns.'),
    ('social-media', 'Анимация публикаций', 'Post animation', 'Simple animation for selected social media layouts.'),
    ('packaging-print', 'Допечатная проверка', 'Prepress review', 'Review of dielines, bleed, and technical production requirements.'),
    ('packaging-print', 'Презентационные mockup', 'Presentation mockups', 'Photorealistic packaging images for websites and presentations.'),
    ('presentation-design', 'Редактура структуры', 'Structure editing', 'Help with shortening and organizing the source material.'),
    ('presentation-design', 'Анимация слайдов', 'Slide animation', 'Careful transitions and staged element reveals.'),
    ('web-design', 'Структура текстов', 'Content structure', 'Headline editing and help with the content of key sections.'),
    ('web-design', 'Кликабельный прототип', 'Clickable prototype', 'A connected interactive flow for presentation and testing.')
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select
  'service_addon',
  addon.id,
  'en',
  jsonb_build_object('title', addon_values.title, 'description', addon_values.description),
  true
from addon_values
join public.services service on service.slug = addon_values.service_slug
join public.service_addons addon
  on addon.service_id = service.id
 and addon.title = addon_values.source_title
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();

with project_image_links as (
  select relation.image_id, relation.project_id
  from public.project_images relation
  union
  select image.id, image.parent_id
  from public.images image
  where image.parent_type = 'project'
    and image.parent_id is not null
)
insert into public.entity_translations (entity_type, entity_id, locale, fields, is_public)
select
  'image',
  image.id,
  'en',
  jsonb_build_object(
    'title', coalesce(project_translation.fields ->> 'title', ''),
    'caption', concat('Project material: ', coalesce(project_translation.fields ->> 'title', project.title))
  ),
  true
from project_image_links link
join public.images image on image.id = link.image_id
join public.projects project on project.id = link.project_id
left join public.entity_translations project_translation
  on project_translation.entity_type = 'project'
 and project_translation.entity_id = project.id
 and project_translation.locale = 'en'
on conflict (entity_type, entity_id, locale)
do update set fields = excluded.fields, is_public = true, updated_at = now();
