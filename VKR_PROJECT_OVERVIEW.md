# Обзор проекта для ВКР

## Назначение системы

Проект представляет собой full-stack веб-приложение портфолио графического дизайнера. Система объединяет публичную витрину работ, каталог услуг, оформление заявки с предварительным расчетом, личный кабинет клиента и административную панель для управления контентом и заказами.

Ключевая идея проекта: показать не только статическое портфолио, но и рабочий процесс взаимодействия с клиентом от выбора услуги до согласования финальных условий заказа. Для этого реализованы публичные страницы, пошаговая форма заявки, хранение заявок в Supabase, роли пользователей, приватные материалы заказа, договор-заказ, административная аналитика и тестовое покрытие основных сценариев.

## Технологический стек

- Next.js App Router: маршрутизация, server components, route handlers и server actions.
- React: интерактивные клиентские компоненты, формы, wizard-интерфейсы.
- TypeScript: типизация доменных сущностей, данных Supabase и props компонентов.
- Tailwind CSS: адаптивная верстка и единая система утилитарных стилей.
- Supabase Postgres: хранение контента, заявок, пользователей, событий аналитики и служебных сущностей.
- Supabase Auth: регистрация и вход клиентов, администраторов и менеджеров.
- Supabase Storage: публичные изображения портфолио и приватные материалы клиентских заказов.
- Zod: валидация форм, ограничений полей и входных данных server actions.
- ExcelJS: экспорт заявок из административной панели в XLSX.
- Vitest: unit/integration-проверки доменной логики.
- Playwright: e2e-проверки публичного сайта, админки, accessibility и live-сценариев Supabase.
- axe-core/playwright: автоматизированная проверка доступности ключевых страниц.

## Общая архитектура

Приложение построено вокруг App Router. Публичные страницы, кабинет клиента, административная зона и API-обработчики находятся в `src/app`. Общая доменная логика вынесена в `src/lib`, UI-компоненты - в `src/components`, SQL-схема и migrations - в `supabase`, автоматические проверки - в `tests`.

Основной поток данных:

1. Публичные страницы читают данные через `src/lib/data/public.ts`.
2. Если Supabase не настроен, публичная часть использует fallback-данные из `src/lib/demo-data.ts`.
3. Заявка создается через server action `src/app/order/actions.ts`.
4. Server action заново валидирует и пересчитывает заявку на сервере, затем сохраняет snapshot в Supabase.
5. Менеджер или администратор обрабатывает заявку через `/admin/requests`.
6. Клиент видит свои заявки и договор-заказы в `/account`.
7. События публичной аналитики отправляются клиентским компонентом на `/api/analytics`, а запись в базу выполняется только на сервере.

## Структура проекта

### Корневые файлы

- `.env.example` - безопасный шаблон переменных окружения без реальных значений.
- `.gitignore` - исключения для локальных env-файлов, build-артефактов, audit-материалов, ExecPlan-файлов и персональных seed-файлов.
- `README.md` - инструкция по запуску, Supabase-настройке и проверкам.
- `PROJECT_STRUCTURE.md` - краткая карта проекта для быстрых правок.
- `VKR_PROJECT_OVERVIEW.md` - расширенное описание системы для ВКР.
- `package.json` - npm-скрипты и зависимости.
- `playwright.config.ts` - конфигурация e2e-тестов и локального web server.
- `vitest.config.ts` - конфигурация unit/integration-тестов.
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` - конфигурация TypeScript, Next.js и Tailwind CSS.

### Публичные маршруты

- `src/app/page.tsx` - главная страница.
- `src/app/about/page.tsx` - страница о дизайнере.
- `src/app/services/page.tsx` - каталог услуг.
- `src/app/portfolio/page.tsx` - список проектов с фильтрацией и сортировкой.
- `src/app/portfolio/[slug]/page.tsx` - детальная страница проекта.
- `src/app/contacts/page.tsx` - контакты.
- `src/app/privacy/page.tsx` - страница политики обработки данных.
- `src/app/order/page.tsx` - пошаговая форма заявки.
- `src/app/order/success/page.tsx` - страница успешной отправки заявки.
- `src/app/api/analytics/route.ts` - серверный endpoint для записи событий аналитики.

### Личный кабинет клиента

- `src/app/account/page.tsx` - список заявок клиента.
- `src/app/account/login/page.tsx` - вход клиента.
- `src/app/account/register/page.tsx` - регистрация клиента.
- `src/app/account/requests/[id]/page.tsx` - детальная страница заявки клиента.
- `src/app/account/actions.ts` - server actions для входа, регистрации, выхода, принятия договор-заказа, привязки гостевой заявки и дозагрузки материалов.

### Административная зона

- `src/app/admin/login/page.tsx` и `src/app/admin/login/actions.ts` - вход в админку.
- `src/app/admin/(protected)/layout.tsx` - protected layout с проверкой роли.
- `src/app/admin/(protected)/page.tsx` - dashboard.
- `src/app/admin/(protected)/analytics/page.tsx` - аналитика заявок, договоров и публичных событий.
- `src/app/admin/(protected)/requests/page.tsx` - список заявок.
- `src/app/admin/(protected)/requests/[id]/page.tsx` - карточка заявки и договор-заказ.
- `src/app/admin/(protected)/requests/export/route.ts` - XLSX-экспорт заявок.
- `src/app/admin/(protected)/pages/page.tsx` - управление страницами и блоками.
- `src/app/admin/(protected)/projects/page.tsx` - управление проектами портфолио.
- `src/app/admin/(protected)/services/page.tsx` - управление услугами, пакетами и доплатами.
- `src/app/admin/(protected)/tags/page.tsx` - управление тегами.
- `src/app/admin/(protected)/images/page.tsx` - загрузка и удаление изображений портфолио.
- `src/app/admin/(protected)/users/page.tsx` и `src/app/admin/(protected)/users/[id]/page.tsx` - список пользователей, фильтры, роли и карточка пользователя.
- `src/app/admin/(protected)/notifications/page.tsx` - уведомления.

### Компоненты

- `src/components/order-form.tsx` - главный контейнер состояния формы заявки.
- `src/components/order/service-step.tsx` - выбор услуги.
- `src/components/order/package-step.tsx` - выбор пакета услуги и marketing-полей.
- `src/components/order/extras-step.tsx` - доплаты и референс-проект.
- `src/components/order/brief-step.tsx` - описание результата, стиля, материалов и сроков.
- `src/components/order/contact-step.tsx` - контакты клиента и вложения.
- `src/components/order/review-step.tsx` - финальная проверка заявки.
- `src/components/order/order-summary.tsx` - сводка предварительной стоимости и сроков.
- `src/components/order/step-navigation.tsx` - навигация wizard.
- `src/components/order-success-client.tsx` - клиентская логика страницы успеха.
- `src/components/analytics-tracker.tsx` - сбор публичных page view и CTA-событий.
- `src/components/admin-shell.tsx` - оболочка админки.
- `src/components/admin-*.tsx` - формы и виджеты административной панели.
- `src/components/form-*.tsx`, `limited-text-control.tsx`, `confirm-submit-button.tsx` - переиспользуемые элементы форм.
- `src/components/site-header.tsx`, `site-footer.tsx`, `project-card.tsx`, `project-gallery-slider.tsx` - публичный интерфейс.

### Доменная логика

- `src/lib/types.ts` - основные типы приложения: услуги, проекты, заявки, договоры, роли, события аналитики.
- `src/lib/validation.ts` - Zod-схемы форм и admin-операций.
- `src/lib/field-limits.ts` - лимиты полей, текстов, файлов и auth-форм.
- `src/lib/data/public.ts` - публичные запросы к Supabase и fallback-данные.
- `src/lib/data/admin.ts` - административные запросы.
- `src/lib/data/client.ts` - запросы личного кабинета клиента.
- `src/lib/data/mappers.ts` - преобразование Supabase rows в доменные типы.
- `src/lib/actions/admin.ts` - административные mutations.
- `src/lib/supabase/server.ts` - создание серверных Supabase-клиентов.
- `src/lib/supabase/database.types.ts` - типы таблиц Supabase для TypeScript.
- `src/lib/order-calculator.ts` - расчет предварительной стоимости и сроков.
- `src/lib/order-draft.ts` - versioned draft формы заявки в `localStorage`.
- `src/lib/order-quiz.ts` - локальный подбор стартовой услуги и пакета по ответам клиента.
- `src/lib/order-attachments.ts` - проверка вложений заказа.
- `src/lib/order-attachment-storage.ts` - загрузка, очистка и signed URLs для приватных материалов.
- `src/lib/request-claim.ts` - генерация, хеширование и проверка гостевого claim token.
- `src/lib/request-status.ts` - статусы заявки и отображаемые подписи.
- `src/lib/request-timeline.ts` - сбор timeline заявки.
- `src/lib/service-package-marketing.ts` - нормализация списка включенных пунктов пакета.
- `src/lib/analytics-events.ts` - нормализация аналитических событий и source hash.
- `src/lib/admin-analytics.ts` - агрегирование KPI, трендов и attention-items для админки.
- `src/lib/admin-user-query.ts` - фильтры и query params списка пользователей.
- `src/lib/page-blocks.ts` - сериализация редактируемых блоков страниц.

### Supabase

- `supabase/schema.sql` - воспроизводимая структура БД, RLS, grants, indexes и Storage bucket settings.
- `supabase/migrations/20260605000000_analytics_events.sql` - события аналитики.
- `supabase/migrations/20260606000000_order_attachments_and_claim_tokens.sql` - приватные материалы заказа и гостевые claim tokens.
- `supabase/migrations/20260607000000_service_package_marketing.sql` - marketing-поля пакетов услуг.
- `supabase/README.md` - безопасная инструкция по Supabase-настройке без персональных данных.

## Реализованные функции

### Публичное портфолио

Публичная часть показывает услуги, проекты, страницы о дизайнере и контакты. Данные берутся из Supabase, а при отсутствии окружения используется fallback из `src/lib/demo-data.ts`. Это позволяет запускать приложение локально без внешней базы и одновременно поддерживать реальное администрирование контента.

Портфолио поддерживает:

- список проектов;
- фильтрацию по услугам и тегам;
- сортировку;
- детальную страницу проекта;
- галерею изображений;
- breadcrumbs;
- адаптивную верстку для desktop, tablet и mobile.

### Управление контентом

Административная панель реализует управление основными сущностями публичного сайта:

- страницы и editable-блоки;
- услуги;
- пакеты услуг;
- доплаты;
- проекты портфолио;
- теги;
- изображения;
- порядок отображения услуг и проектов.

Основные mutations находятся в `src/lib/actions/admin.ts`, а чтение данных - в `src/lib/data/admin.ts`.

### Заявка на заказ

Форма `/order` построена как wizard из шести шагов:

1. выбор услуги;
2. выбор пакета;
3. доплаты и референс;
4. brief;
5. контакты и файлы;
6. проверка перед отправкой.

`src/components/order-form.tsx` хранит состояние формы, управляет переходами между шагами, draft-логикой, отправкой server action и клиентской сводкой. UI каждого шага вынесен в отдельный компонент в `src/components/order/`.

Форма реализует:

- preliminary estimate по пакету и доплатам;
- локальный draft в `localStorage`;
- защиту от поврежденного draft через версионированный parser;
- быстрые chips для brief-полей;
- подбор стартовой услуги через локальный quiz;
- проверку обязательных полей перед переходом;
- загрузку материалов;
- snapshot выбранной конфигурации заявки.

### Предварительный расчет стоимости и сроков

Алгоритм расчета находится в `src/lib/order-calculator.ts`.

Расчет выполняется по простой и прозрачной модели:

- базовый диапазон цены берется из выбранного пакета;
- базовый диапазон сроков берется из выбранного пакета;
- цена каждой выбранной доплаты добавляется к нижней и верхней границе цены;
- срок каждой выбранной доплаты добавляется к нижней и верхней границе сроков.

Такой подход удобен для ВКР, потому что он объясним, тестируем и не зависит от внешних сервисов.

### Локальный подбор услуги

`src/lib/order-quiz.ts` реализует rule-based подбор услуги. Пользователь отвечает на короткие вопросы о типе задачи, цели, срочности, наличии материалов и масштабе. Алгоритм сопоставляет тип задачи с приоритетным набором slug-ов услуг и выбирает первую активную услугу и первый активный пакет по `displayOrder`.

Результат quiz не заменяет выбор пользователя, а только заполняет стартовую конфигурацию формы.

### Сохранение заявки

Server action `submitOrderAction` в `src/app/order/actions.ts` выполняет серверную обработку заявки:

- читает `FormData`;
- валидирует поля через Zod;
- получает актуальные услуги, пакеты и доплаты;
- заново пересчитывает estimate на сервере;
- формирует snapshot выбранной услуги, пакета и доплат;
- проверяет ограничения вложений;
- сохраняет заявку в `public.requests`;
- загружает материалы в приватный bucket;
- создает одноразовый гостевой claim token;
- возвращает результат для страницы успеха.

Расчет на сервере важен, потому что клиентская форма не считается доверенным источником цены и сроков.

### Гостевая заявка и claim token

Когда заявка отправлена без авторизованного клиента, система создает одноразовый claim token. В базе хранится только SHA-256 hash токена, а сам token передается клиенту через success-сценарий.

`src/lib/request-claim.ts` реализует:

- создание token expiration timestamp;
- SHA-256 hash;
- проверку истечения срока.

`src/app/account/actions.ts` использует token после входа или регистрации клиента и связывает заявку с `client_user_id`. Token одноразовый: после успешной привязки он помечается как использованный.

### Личный кабинет клиента

Кабинет клиента реализует:

- просмотр собственных заявок;
- карточку заявки;
- timeline событий;
- просмотр договор-заказа;
- принятие договор-заказа;
- загрузку дополнительных материалов;
- signed URL для приватных вложений.

Чтение заявок клиента выполняет `src/lib/data/client.ts`. Доступ ограничивается текущим пользователем и RLS-политиками Supabase.

### Timeline заявки

`src/lib/request-timeline.ts` собирает timeline из нескольких источников:

- создание заявки;
- история изменения статусов;
- отправка договор-заказа;
- принятие договор-заказа;
- загруженные материалы.

События приводятся к единому типу `RequestTimelineEvent`, сортируются по `createdAt` и отображаются на странице `/account/requests/[id]`.

### Договор-заказ

Менеджер или администратор может подготовить договор-заказ в карточке заявки. В нем фиксируются финальные условия:

- итоговая стоимость;
- срок;
- объем работ;
- материалы;
- комментарий менеджера;
- статус.

Клиент видит договор-заказ в кабинете и может принять его. После принятия сохраняется `acceptedAt`, а timeline получает отдельное событие.

### Приватные материалы заказа

Материалы клиента хранятся отдельно от публичных изображений портфолио:

- публичные изображения используют bucket `portfolio-images`;
- материалы заказа используют private bucket `order-attachments`;
- метаданные вложений хранятся в `public.order_attachments`;
- чтение файлов выполняется через server-created signed URLs.

`src/lib/order-attachments.ts` проверяет типы, размеры и количество файлов. `src/lib/order-attachment-storage.ts` отвечает за загрузку, удаление при ошибках и генерацию signed URLs.

### Административная аналитика

Аналитика состоит из двух частей:

- server-side запись публичных событий в `analytics_events`;
- агрегирование данных для страницы `/admin/analytics`.

`src/components/analytics-tracker.tsx` отслеживает публичные page views и CTA clicks. События отправляются на `/api/analytics`, где `src/lib/analytics-events.ts` нормализует payload, ограничивает длины полей, допускает только публичные route paths и формирует дневной `source_hash`.

`src/lib/admin-analytics.ts` строит:

- KPI по заявкам;
- распределение по статусам;
- распределение по услугам;
- конверсионные показатели;
- trend по периодам;
- список attention-items для менеджера.

### Пользователи и роли

В системе используются роли:

- `admin`;
- `manager`;
- `client`.

Проверки роли выполняются на сервере. Административные страницы находятся под protected layout. Управление ролями реализовано в `/admin/users` и `src/lib/actions/admin.ts`.

### Уведомления

Админка содержит раздел уведомлений. Данные уведомлений читаются через `src/lib/data/notifications.ts`, а marking read выполняется через server action `markNotificationReadAction`.

### Экспорт заявок

`src/app/admin/(protected)/requests/export/route.ts` формирует XLSX-файл через ExcelJS. Экспорт использует административный data layer и позволяет выгружать заявки для анализа или отчетности.

## Решения по безопасности и информационной гигиене

- Реальные `.env`-значения не хранятся в Git.
- `.env.example` содержит только имена переменных без персональных данных.
- Server-side Supabase secret используется только в серверных модулях.
- Прямые public inserts в `requests` через Supabase Data API запрещены RLS/grants.
- Заявка пересчитывается на сервере перед сохранением.
- Приватные материалы заказа не попадают в публичный bucket.
- Клиент получает доступ только к своим заявкам и вложениям.
- Claim token хранится в базе только в виде hash.
- Analytics source hash строится по дневному bucket, IP и user agent, без сохранения исходного IP в доменной модели приложения.
- Seed-файлы с персональными demo-контактами не хранятся в публичном Git.

## Алгоритмы и обработка данных

### Фильтрация портфолио

`src/lib/data/public.ts` содержит `filterProjects`, который применяет выбранные услуги и теги к списку проектов. Фильтрация работает поверх доменных типов `Project`, `Service` и `Tag`, поэтому UI не зависит от структуры Supabase rows.

### Mapping Supabase rows

`src/lib/data/mappers.ts` отделяет формат таблиц Supabase от формата приложения. Это снижает связанность: компоненты получают доменные объекты, а не raw rows.

### Draft формы заявки

`parseOrderDraft` из `src/lib/order-draft.ts`:

- принимает raw JSON из `localStorage`;
- проверяет версию draft;
- проверяет форму объекта;
- приводит неизвестные значения к безопасным defaults;
- игнорирует поврежденный draft.

### Brief chips

`appendBriefChip` добавляет выбранный chip в текстовое поле, но не создает дубликаты. Сравнение выполняется в lower-case после trim.

### Analytics payload

`parseAnalyticsEventPayload`:

- принимает только `page_view` и `cta_click`;
- разрешает только публичные paths;
- ограничивает длину path, search, referrer, href, label;
- ограничивает количество metadata entries;
- отбрасывает некорректный payload.

### Request timeline

`buildRequestTimeline` объединяет события разных типов в один массив и сортирует по времени. Это позволяет показывать клиенту последовательную историю заявки без отдельной таблицы timeline events.

### Очистка файлов при ошибках

Загрузка вложений устроена так, чтобы при частичной ошибке можно было удалить уже загруженные Storage objects и metadata rows. Это уменьшает риск orphaned-файлов.

## База данных

Основные группы таблиц:

- контент: `pages`, `services`, `service_packages`, `service_addons`, `tags`, `projects`, `project_images`, `images`, `entity_translations`;
- заказы: `requests`, `request_status_history`, `order_contracts`, `order_attachments`, `request_claim_tokens`;
- пользователи: `profiles`;
- уведомления: `notifications`, `notification_reads`;
- аналитика: `analytics_events`;
- storage metadata: Supabase `storage.buckets` и `storage.objects`.

Схема хранится в `supabase/schema.sql`, а изменения - в `supabase/migrations/`.

## Тестирование

Проект покрыт несколькими уровнями проверок:

- `npm run typecheck` - TypeScript-проверка.
- `npm run lint` - ESLint.
- `npm run test` - Vitest unit/integration tests.
- `npm run build` - production build Next.js.
- `npm run test:e2e -- tests/e2e/public.spec.ts --reporter=line` - публичные сценарии.
- `npm run test:e2e -- tests/e2e/accessibility.spec.ts --reporter=line` - accessibility smoke.
- `SUPABASE_RLS_SMOKE=1 npm run test -- tests/supabase-rls-smoke.test.ts` - live RLS smoke.
- `PLAYWRIGHT_SUPABASE_E2E=1 npm run test:e2e -- tests/e2e/account-accessibility.spec.ts --reporter=line` - live accessibility страницы заявки клиента.
- `PLAYWRIGHT_SUPABASE_E2E=1 npm run test:e2e -- tests/e2e/supabase-admin.spec.ts --reporter=line` - live admin/order smoke.

Ключевые тестовые файлы:

- `tests/order-experience.test.ts` - draft, chips, quiz, вложения, claim token и timeline.
- `tests/supabase-schema.test.ts` - SQL/RLS/migration coverage.
- `tests/admin-analytics.test.ts` - KPI и агрегирование аналитики.
- `tests/analytics-events.test.ts` - нормализация аналитических событий и source hash.
- `tests/e2e/public.spec.ts` - публичные пользовательские сценарии.
- `tests/e2e/supabase-admin.spec.ts` - live-сценарии ролей, заявок, аналитики, файлов и договор-заказа.

## Практическая ценность для ВКР

Проект демонстрирует полный цикл разработки прикладной информационной системы:

- анализ предметной области портфолио и заказов дизайнера;
- проектирование ролей и сценариев взаимодействия;
- реализация публичной части и административного интерфейса;
- организация серверной обработки форм;
- хранение и защита данных в Supabase;
- разделение публичных и приватных файлов;
- валидация входных данных;
- аудит доступности;
- автоматизированное тестирование критичных пользовательских потоков.

Этот файл можно использовать как основу для разделов ВКР об архитектуре, функциональных требованиях, реализованных модулях, алгоритмах обработки данных, безопасности и проверке работоспособности системы.
