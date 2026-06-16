with package_recommendation_tags(service_slug, package_title, tags) as (
  values
    (
      'brand-identity',
      'Логотип',
      '{"taskType":["brand"],"goal":["launch","refresh"],"urgency":["standard","fast"],"materials":["partial","ready"],"scope":["single"]}'::jsonb
    ),
    (
      'brand-identity',
      'Фирменный стиль',
      '{"taskType":["brand"],"goal":["launch","sell","refresh"],"urgency":["standard"],"materials":["none","partial"],"scope":["full"]}'::jsonb
    ),
    (
      'brand-identity',
      'Бренд-система',
      '{"taskType":["brand"],"goal":["launch","refresh"],"urgency":["standard"],"materials":["none","partial"],"scope":["full"]}'::jsonb
    ),
    (
      'social-media',
      'Старт',
      '{"taskType":["social"],"goal":["launch","refresh"],"urgency":["standard","fast"],"materials":["partial","ready"],"scope":["single"]}'::jsonb
    ),
    (
      'social-media',
      'Контент-система',
      '{"taskType":["social"],"goal":["launch","sell","refresh"],"urgency":["standard"],"materials":["partial","ready"],"scope":["full"]}'::jsonb
    ),
    (
      'social-media',
      'Сопровождение на месяц',
      '{"taskType":["social"],"goal":["sell","refresh"],"urgency":["standard"],"materials":["partial","ready"],"scope":["full"]}'::jsonb
    ),
    (
      'packaging-print',
      'Один носитель',
      '{"taskType":["packaging"],"goal":["launch","sell","refresh"],"urgency":["standard","fast"],"materials":["partial","ready"],"scope":["single"]}'::jsonb
    ),
    (
      'packaging-print',
      'Линейка',
      '{"taskType":["packaging"],"goal":["launch","sell","refresh"],"urgency":["standard"],"materials":["partial","ready"],"scope":["full"]}'::jsonb
    ),
    (
      'packaging-print',
      'Комплекс',
      '{"taskType":["packaging"],"goal":["launch","sell"],"urgency":["standard"],"materials":["none","partial"],"scope":["full"]}'::jsonb
    ),
    (
      'presentation-design',
      'До 10 слайдов',
      '{"taskType":["presentation"],"goal":["sell","event"],"urgency":["standard","fast"],"materials":["partial","ready"],"scope":["single"]}'::jsonb
    ),
    (
      'presentation-design',
      'До 20 слайдов',
      '{"taskType":["presentation"],"goal":["launch","sell","event"],"urgency":["standard"],"materials":["partial","ready"],"scope":["full"]}'::jsonb
    ),
    (
      'presentation-design',
      'Шаблон и система',
      '{"taskType":["presentation"],"goal":["sell","refresh"],"urgency":["standard"],"materials":["partial","ready"],"scope":["full"]}'::jsonb
    ),
    (
      'web-design',
      'Лендинг',
      '{"taskType":["other"],"goal":["launch","sell","event"],"urgency":["standard","fast"],"materials":["partial","ready"],"scope":["single"]}'::jsonb
    ),
    (
      'web-design',
      'Корпоративный сайт',
      '{"taskType":["other"],"goal":["launch","sell","refresh"],"urgency":["standard"],"materials":["partial","ready"],"scope":["full"]}'::jsonb
    ),
    (
      'web-design',
      'Интерфейс продукта',
      '{"taskType":["other"],"goal":["launch","refresh"],"urgency":["standard"],"materials":["none","partial"],"scope":["full"]}'::jsonb
    )
)
update public.service_packages as service_package
set recommendation_tags = package_recommendation_tags.tags
from public.services as service, package_recommendation_tags
where service_package.service_id = service.id
  and service.slug = package_recommendation_tags.service_slug
  and service_package.title = package_recommendation_tags.package_title;
