insert into public.pages (page_key, title, body, blocks)
values
  ('home', 'Графический дизайн, который помогает брендам говорить точнее', 'Портфолио дизайнера с фокусом на айдентику, упаковку, digital-материалы и презентации. Каждый проект строится вокруг задачи бизнеса и визуальной ясности.', '{"cta":"Обсудить проект","secondaryCta":"Смотреть портфолио"}'),
  ('about', 'О дизайнере', 'Я помогаю малому бизнесу, экспертам и творческим командам упаковывать идеи в визуальные системы: от логотипа и носителей до презентаций, социальных сетей и печатных материалов.', '{"experience":"5+ лет в брендинге и коммерческом дизайне","focus":"айдентика, упаковка, digital, editorial"}'),
  ('services', 'Услуги', 'Можно заказать отдельную задачу или собрать комплексный пакет под запуск продукта, мероприятия или обновление бренда.', '{}'),
  ('contacts', 'Контакты', 'Для запроса проекта заполните форму заявки или напишите напрямую. Ответ обычно занимает один рабочий день.', '{"email":"designer@example.com","telegram":"@design_portfolio"}')
on conflict (page_key) do update set
  title = excluded.title,
  body = excluded.body,
  blocks = excluded.blocks;

insert into public.services (title, slug, description, details, display_order, is_active)
values
  ('Айдентика бренда', 'brand-identity', 'Логотип, визуальная система, палитра, типографика и правила применения.', 'Подходит для нового бизнеса или обновления существующего образа.', 10, true),
  ('Дизайн социальных сетей', 'social-media', 'Шаблоны постов, обложки, рекламные макеты и визуальная сетка.', 'Помогает сделать коммуникацию в соцсетях узнаваемой и регулярной.', 20, true),
  ('Упаковка и полиграфия', 'packaging-print', 'Этикетки, упаковка, визитки, буклеты и печатные материалы.', 'Готовится с учётом технических ограничений печати.', 30, true),
  ('Презентации', 'presentation-design', 'Структура и визуальное оформление коммерческих и экспертных презентаций.', 'Фокус на ясности, ритме слайдов и убедительной подаче.', 40, true)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  details = excluded.details,
  display_order = excluded.display_order,
  is_active = excluded.is_active;

with package_seed (service_slug, title, description, price_from, price_to, duration_from_days, duration_to_days, display_order, is_active) as (
  values
    ('brand-identity', 'Старт', 'Логотип, палитра, базовая типографика и краткая памятка по применению.', 25000, 45000, 10, 18, 10, true),
    ('brand-identity', 'Система', 'Айдентика с носителями, правилами применения и подготовкой макетов для запуска.', 60000, 120000, 18, 30, 20, true),
    ('social-media', 'Контент-месяц', 'Набор шаблонов и визуальная сетка для регулярных публикаций.', 18000, 36000, 7, 14, 10, true),
    ('packaging-print', 'Один носитель', 'Дизайн этикетки, упаковки или печатного макета с подготовкой к производству.', 22000, 50000, 10, 20, 10, true),
    ('presentation-design', 'До 20 слайдов', 'Структура, визуальный стиль и оформление презентации для выступления или продажи.', 20000, 42000, 7, 14, 10, true)
)
insert into public.service_packages (
  service_id,
  title,
  description,
  price_from,
  price_to,
  duration_from_days,
  duration_to_days,
  display_order,
  is_active
)
select
  service.id,
  package_seed.title,
  package_seed.description,
  package_seed.price_from,
  package_seed.price_to,
  package_seed.duration_from_days,
  package_seed.duration_to_days,
  package_seed.display_order,
  package_seed.is_active
from package_seed
join public.services service on service.slug = package_seed.service_slug
where not exists (
  select 1
  from public.service_packages service_package
  where service_package.service_id = service.id
    and service_package.title = package_seed.title
);

update public.service_packages service_package
set badge = package_marketing.badge,
    best_for = package_marketing.best_for,
    outcome = package_marketing.outcome,
    included_items = package_marketing.included_items,
    is_recommended = package_marketing.is_recommended
from public.services service
join (
  values
    ('brand-identity', 'Старт', 'Популярный', 'Для запуска или обновления малого бренда', 'Логотип, палитра и базовая памятка по применению', array['Логотип', 'Палитра', 'Базовая типографика', 'Памятка по применению']::text[], true),
    ('brand-identity', 'Система', 'Комплекс', 'Для бренда, которому нужна система носителей', 'Айдентика с правилами и стартовыми макетами', array['Логотип', 'Палитра', 'Типографика', 'Правила применения', 'Стартовые носители']::text[], false),
    ('social-media', 'Контент-месяц', 'Регулярно', 'Для стабильного визуального контента в соцсетях', 'Набор шаблонов и визуальная сетка публикаций', array['Шаблоны постов', 'Обложки', 'Визуальная сетка']::text[], true),
    ('packaging-print', 'Один носитель', 'Тираж', 'Для одного печатного или упаковочного носителя', 'Готовый макет с подготовкой к производству', array['Дизайн носителя', 'Подготовка к печати', 'Финальные файлы']::text[], true),
    ('presentation-design', 'До 20 слайдов', 'Презентация', 'Для коммерческого предложения или выступления', 'Структурная презентация до 20 слайдов', array['Структура', 'Визуальный стиль', 'Оформление слайдов']::text[], true)
) as package_marketing(service_slug, title, badge, best_for, outcome, included_items, is_recommended)
  on service.slug = package_marketing.service_slug
where service_package.service_id = service.id
  and service_package.title = package_marketing.title;

with addon_seed (service_slug, title, description, price, duration_days, display_order, is_active) as (
  values
    ('brand-identity', 'Расширенный бренд-гайд', 'Дополнительные правила для команды, подрядчиков и печатных носителей.', 18000, 5, 10, true),
    ('brand-identity', 'Приоритетный старт', 'Ускоренный запуск проекта при свободном окне в графике.', 12000, 0, 20, true),
    ('social-media', 'Рекламные макеты', 'Дополнительные форматы для таргетированной рекламы.', 9000, 3, 10, true),
    ('packaging-print', 'Допечатная проверка', 'Проверка технических требований типографии и подготовка финальных файлов.', 8000, 2, 10, true),
    ('presentation-design', 'Шаблон для команды', 'Набор редактируемых мастер-слайдов для дальнейшего использования.', 10000, 3, 10, true)
)
insert into public.service_addons (
  service_id,
  title,
  description,
  price,
  duration_days,
  display_order,
  is_active
)
select
  service.id,
  addon_seed.title,
  addon_seed.description,
  addon_seed.price,
  addon_seed.duration_days,
  addon_seed.display_order,
  addon_seed.is_active
from addon_seed
join public.services service on service.slug = addon_seed.service_slug
where not exists (
  select 1
  from public.service_addons addon
  where addon.service_id = service.id
    and addon.title = addon_seed.title
);

update public.service_packages service_package
set is_active = false
where service_package.title = 'Базовый пакет'
  and service_package.description = 'Предварительный состав работ и итоговая стоимость уточняются после брифа.'
  and exists (
    select 1
    from public.service_packages specific_package
    where specific_package.service_id = service_package.service_id
      and specific_package.id <> service_package.id
  );

update public.service_addons addon
set is_active = false
where addon.title = 'Срочная подготовка'
  and addon.description = 'Приоритетная работа над заказом при наличии свободного окна в графике.'
  and exists (
    select 1
    from public.service_addons specific_addon
    where specific_addon.service_id = addon.service_id
      and specific_addon.id <> addon.id
  );

insert into public.tags (title, slug, description)
values
  ('Брендинг', 'branding', 'Проекты с визуальной системой бренда'),
  ('Digital', 'digital', 'Материалы для онлайн-коммуникации'),
  ('Печать', 'print', 'Печатные и упаковочные носители'),
  ('Минимализм', 'minimal', 'Сдержанная визуальная подача'),
  ('Иллюстрация', 'illustration', 'Авторская графика и иллюстративные элементы')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description;

with inserted_projects as (
  insert into public.projects (title, slug, short_description, full_description, cover_image_url, is_published)
  values
    ('Botanica Lab', 'botanica-lab', 'Айдентика и упаковка для камерной линейки натуральной косметики.', 'Задача проекта заключалась в том, чтобы соединить лабораторную чистоту и мягкую природную эстетику. В результате появилась система с лаконичным знаком, спокойной палитрой и гибкими макетами для упаковки.', '/assets/botanica-lab-cover.png', true),
    ('North Coffee Roasters', 'north-coffee-roasters', 'Серия упаковок и печатных материалов для кофейной обжарки.', 'Проект строился вокруг контраста ремесленного продукта и современной навигации по вкусам. Для линейки разработаны цветовые коды, этикетки и набор POS-материалов.', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80', true),
    ('Studio Frame', 'studio-frame', 'Digital-система для визуальных анонсов и социальных сетей фотостудии.', 'Для студии создана модульная сетка публикаций, набор шаблонов и визуальные правила, которые помогают команде выпускать материалы без потери качества.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80', true),
    ('Urban Forum Deck', 'urban-forum-deck', 'Презентация для городского образовательного форума.', 'Слайды были перестроены вокруг ясного сценария выступления. Визуальный язык сочетает крупную типографику, карты, фотографии и спокойные акцентные блоки.', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80', true)
  on conflict (slug) do update set
    title = excluded.title,
    short_description = excluded.short_description,
    full_description = excluded.full_description,
    cover_image_url = excluded.cover_image_url,
    is_published = excluded.is_published
  returning id, slug
)
insert into public.project_services (project_id, service_id)
select p.id, s.id
from public.projects p
join public.services s on (
  (p.slug = 'botanica-lab' and s.slug in ('brand-identity', 'packaging-print')) or
  (p.slug = 'north-coffee-roasters' and s.slug in ('brand-identity', 'packaging-print')) or
  (p.slug = 'studio-frame' and s.slug in ('social-media')) or
  (p.slug = 'urban-forum-deck' and s.slug in ('presentation-design'))
)
on conflict do nothing;

insert into public.project_tags (project_id, tag_id)
select p.id, t.id
from public.projects p
join public.tags t on (
  (p.slug = 'botanica-lab' and t.slug in ('branding', 'minimal', 'print')) or
  (p.slug = 'north-coffee-roasters' and t.slug in ('branding', 'print')) or
  (p.slug = 'studio-frame' and t.slug in ('digital', 'minimal')) or
  (p.slug = 'urban-forum-deck' and t.slug in ('digital'))
)
on conflict do nothing;
