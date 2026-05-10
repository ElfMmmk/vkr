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
