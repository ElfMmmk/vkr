import type {
  OrderRequest,
  PageContent,
  Project,
  Service,
  Tag
} from "@/lib/types";

export const demoServices: Service[] = [
  {
    id: "svc-brand",
    title: "Айдентика бренда",
    slug: "brand-identity",
    description: "Логотип, визуальная система, палитра, типографика и правила применения.",
    details: "Подходит для нового бизнеса или обновления существующего образа.",
    displayOrder: 10,
    isActive: true,
    packages: [
      {
        id: "pkg-brand-start",
        serviceId: "svc-brand",
        title: "Старт",
        description: "Логотип, палитра, базовая типографика и краткая памятка по применению.",
        badge: "Популярный",
        bestFor: "Для запуска или обновления малого бренда",
        outcome: "Логотип, палитра и базовая памятка по применению",
        includedItems: ["Логотип", "Палитра", "Базовая типографика", "Памятка по применению"],
        priceFrom: 25000,
        priceTo: 45000,
        durationFromDays: 10,
        durationToDays: 18,
        displayOrder: 10,
        isActive: true,
        isRecommended: true
      },
      {
        id: "pkg-brand-system",
        serviceId: "svc-brand",
        title: "Система",
        description: "Айдентика с носителями, правилами применения и подготовкой макетов для запуска.",
        badge: "Комплекс",
        bestFor: "Для бренда, которому нужна система носителей",
        outcome: "Айдентика с правилами и стартовыми макетами",
        includedItems: ["Логотип", "Палитра", "Типографика", "Правила применения", "Стартовые носители"],
        priceFrom: 60000,
        priceTo: 120000,
        durationFromDays: 18,
        durationToDays: 30,
        displayOrder: 20,
        isActive: true,
        isRecommended: false
      }
    ],
    addons: [
      {
        id: "addon-brand-guide",
        serviceId: "svc-brand",
        title: "Расширенный бренд-гайд",
        description: "Дополнительные правила для команды, подрядчиков и печатных носителей.",
        price: 18000,
        durationDays: 5,
        displayOrder: 10,
        isActive: true
      },
      {
        id: "addon-brand-fast",
        serviceId: "svc-brand",
        title: "Приоритетный старт",
        description: "Ускоренный запуск проекта при свободном окне в графике.",
        price: 12000,
        durationDays: 0,
        displayOrder: 20,
        isActive: true
      }
    ]
  },
  {
    id: "svc-social",
    title: "Дизайн социальных сетей",
    slug: "social-media",
    description: "Шаблоны постов, обложки, рекламные макеты и визуальная сетка.",
    details: "Помогает сделать коммуникацию в соцсетях узнаваемой и регулярной.",
    displayOrder: 20,
    isActive: true,
    packages: [
      {
        id: "pkg-social-month",
        serviceId: "svc-social",
        title: "Контент-месяц",
        description: "Набор шаблонов и визуальная сетка для регулярных публикаций.",
        badge: "Регулярно",
        bestFor: "Для стабильного визуального контента в соцсетях",
        outcome: "Набор шаблонов и визуальная сетка публикаций",
        includedItems: ["Шаблоны постов", "Обложки", "Визуальная сетка"],
        priceFrom: 18000,
        priceTo: 36000,
        durationFromDays: 7,
        durationToDays: 14,
        displayOrder: 10,
        isActive: true,
        isRecommended: true
      }
    ],
    addons: [
      {
        id: "addon-social-ads",
        serviceId: "svc-social",
        title: "Рекламные макеты",
        description: "Дополнительные форматы для таргетированной рекламы.",
        price: 9000,
        durationDays: 3,
        displayOrder: 10,
        isActive: true
      }
    ]
  },
  {
    id: "svc-packaging",
    title: "Упаковка и полиграфия",
    slug: "packaging-print",
    description: "Этикетки, упаковка, визитки, буклеты и печатные материалы.",
    details: "Готовится с учётом технических ограничений печати.",
    displayOrder: 30,
    isActive: true,
    packages: [
      {
        id: "pkg-packaging-basic",
        serviceId: "svc-packaging",
        title: "Один носитель",
        description: "Дизайн этикетки, упаковки или печатного макета с подготовкой к производству.",
        badge: "Тираж",
        bestFor: "Для одного печатного или упаковочного носителя",
        outcome: "Готовый макет с подготовкой к производству",
        includedItems: ["Дизайн носителя", "Подготовка к печати", "Финальные файлы"],
        priceFrom: 22000,
        priceTo: 50000,
        durationFromDays: 10,
        durationToDays: 20,
        displayOrder: 10,
        isActive: true,
        isRecommended: true
      }
    ],
    addons: [
      {
        id: "addon-packaging-prepress",
        serviceId: "svc-packaging",
        title: "Допечатная проверка",
        description: "Проверка технических требований типографии и подготовка финальных файлов.",
        price: 8000,
        durationDays: 2,
        displayOrder: 10,
        isActive: true
      }
    ]
  },
  {
    id: "svc-presentation",
    title: "Презентации",
    slug: "presentation-design",
    description: "Структура и визуальное оформление коммерческих и экспертных презентаций.",
    details: "Фокус на ясности, ритме слайдов и убедительной подаче.",
    displayOrder: 40,
    isActive: true,
    packages: [
      {
        id: "pkg-presentation-core",
        serviceId: "svc-presentation",
        title: "До 20 слайдов",
        description: "Структура, визуальный стиль и оформление презентации для выступления или продажи.",
        badge: "Презентация",
        bestFor: "Для коммерческого предложения или выступления",
        outcome: "Структурная презентация до 20 слайдов",
        includedItems: ["Структура", "Визуальный стиль", "Оформление слайдов"],
        priceFrom: 20000,
        priceTo: 42000,
        durationFromDays: 7,
        durationToDays: 14,
        displayOrder: 10,
        isActive: true,
        isRecommended: true
      }
    ],
    addons: [
      {
        id: "addon-presentation-template",
        serviceId: "svc-presentation",
        title: "Шаблон для команды",
        description: "Набор редактируемых мастер-слайдов для дальнейшего использования.",
        price: 10000,
        durationDays: 3,
        displayOrder: 10,
        isActive: true
      }
    ]
  }
];

export const demoTags: Tag[] = [
  {
    id: "tag-branding",
    title: "Брендинг",
    slug: "branding",
    description: "Проекты с визуальной системой бренда"
  },
  {
    id: "tag-digital",
    title: "Digital",
    slug: "digital",
    description: "Материалы для онлайн-коммуникации"
  },
  {
    id: "tag-print",
    title: "Печать",
    slug: "print",
    description: "Печатные и упаковочные носители"
  },
  {
    id: "tag-minimal",
    title: "Минимализм",
    slug: "minimal",
    description: "Сдержанная визуальная подача"
  }
];

export const demoPages: PageContent[] = [
  {
    id: "page-home",
    pageKey: "home",
    title: "Графический дизайн, который помогает брендам говорить точнее",
    body: "Портфолио дизайнера с фокусом на айдентику, упаковку, digital-материалы и презентации. Каждый проект строится вокруг задачи бизнеса и визуальной ясности.",
    blocks: {
      cta: "Обсудить проект",
      secondaryCta: "Смотреть портфолио"
    }
  },
  {
    id: "page-about",
    pageKey: "about",
    title: "О дизайнере",
    body: "Я помогаю малому бизнесу, экспертам и творческим командам упаковывать идеи в визуальные системы: от логотипа и носителей до презентаций, социальных сетей и печатных материалов.",
    blocks: {
      experience: "5+ лет в брендинге и коммерческом дизайне",
      focus: "айдентика, упаковка, digital, editorial"
    }
  },
  {
    id: "page-services",
    pageKey: "services",
    title: "Услуги",
    body: "Можно заказать отдельную задачу или собрать комплексный пакет под запуск продукта, мероприятия или обновление бренда.",
    blocks: {}
  },
  {
    id: "page-contacts",
    pageKey: "contacts",
    title: "Контакты",
    body: "Для запроса проекта заполните форму заявки или напишите напрямую. Ответ обычно занимает один рабочий день.",
    blocks: {
      email: "designer@example.com",
      telegram: "@design_portfolio"
    }
  }
];

const projectDate = "2026-05-10T00:00:00.000Z";
const projectDates = {
  botanica: "2026-05-10T00:00:00.000Z",
  coffee: "2026-04-18T00:00:00.000Z",
  frame: "2026-03-24T00:00:00.000Z",
  forum: "2026-05-01T00:00:00.000Z"
};

export const demoProjects: Project[] = [
  {
    id: "project-botanica",
    title: "Botanica Lab",
    slug: "botanica-lab",
    shortDescription: "Айдентика и упаковка для камерной линейки натуральной косметики.",
    fullDescription:
      "Задача проекта заключалась в том, чтобы соединить лабораторную чистоту и мягкую природную эстетику. В результате появилась система с лаконичным знаком, спокойной палитрой и гибкими макетами для упаковки.",
    coverImageId: null,
    coverImageUrl: "/assets/botanica-lab-cover.png",
    displayOrder: 20,
    isFeatured: true,
    isPublished: true,
    createdAt: projectDates.botanica,
    services: [demoServices[0], demoServices[2]],
    tags: [demoTags[0], demoTags[2], demoTags[3]],
    gallery: []
  },
  {
    id: "project-coffee",
    title: "North Coffee Roasters",
    slug: "north-coffee-roasters",
    shortDescription: "Серия упаковок и печатных материалов для кофейной обжарки.",
    fullDescription:
      "Проект строился вокруг контраста ремесленного продукта и современной навигации по вкусам. Для линейки разработаны цветовые коды, этикетки и набор POS-материалов.",
    coverImageId: null,
    coverImageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
    displayOrder: 10,
    isFeatured: true,
    isPublished: true,
    createdAt: projectDates.coffee,
    services: [demoServices[0], demoServices[2]],
    tags: [demoTags[0], demoTags[2]],
    gallery: []
  },
  {
    id: "project-frame",
    title: "Studio Frame",
    slug: "studio-frame",
    shortDescription: "Digital-система для визуальных анонсов и социальных сетей фотостудии.",
    fullDescription:
      "Для студии создана модульная сетка публикаций, набор шаблонов и визуальные правила, которые помогают команде выпускать материалы без потери качества.",
    coverImageId: null,
    coverImageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    displayOrder: 40,
    isFeatured: false,
    isPublished: true,
    createdAt: projectDates.frame,
    services: [demoServices[1]],
    tags: [demoTags[1], demoTags[3]],
    gallery: [
      {
        id: "image-frame-identity",
        storagePath: "",
        publicUrl: "/assets/botanica-lab-cover.png",
        title: "Пример визуальной системы",
        caption: "Пример визуальной системы в другой пропорции",
        parentType: "project",
        parentId: "project-frame",
        sortOrder: 10
      }
    ]
  },
  {
    id: "project-forum",
    title: "Urban Forum Deck",
    slug: "urban-forum-deck",
    shortDescription: "Презентация для городского образовательного форума.",
    fullDescription:
      "Слайды были перестроены вокруг ясного сценария выступления. Визуальный язык сочетает крупную типографику, карты, фотографии и спокойные акцентные блоки.",
    coverImageId: null,
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    displayOrder: 30,
    isFeatured: true,
    isPublished: true,
    createdAt: projectDates.forum,
    services: [demoServices[3]],
    tags: [demoTags[1]],
    gallery: []
  }
];

export const demoRequests: OrderRequest[] = [
  {
    id: "request-demo",
    clientName: "Мария",
    contactMethod: "Telegram",
    contactValue: "@client",
    serviceId: "svc-brand",
    serviceTitle: "Айдентика бренда",
    packageId: "pkg-brand-start",
    packageTitle: "Старт",
    packageDescription: "Логотип, палитра, базовая типографика и краткая памятка по применению.",
    packagePriceFrom: 25000,
    packagePriceTo: 45000,
    packageDurationFromDays: 10,
    packageDurationToDays: 18,
    selectedAddons: [
      {
        id: "addon-brand-guide",
        title: "Расширенный бренд-гайд",
        description: "Дополнительные правила для команды, подрядчиков и печатных носителей.",
        price: 18000,
        durationDays: 5
      }
    ],
    referenceProjectId: "project-botanica",
    referenceProjectTitle: "Botanica Lab",
    referenceProjectSlug: "botanica-lab",
    resultDescription: "Нужна визуальная система для запуска новой студии.",
    stylePreferences: "Спокойная минималистичная подача, натуральная палитра.",
    materials: "Логотип, палитра, шаблон визитки и правила применения.",
    desiredDeadline: "Запуск через месяц",
    estimatedPriceFrom: 43000,
    estimatedPriceTo: 63000,
    estimatedDurationFromDays: 15,
    estimatedDurationToDays: 23,
    comment: "Нужна визуальная система для запуска новой студии.",
    status: "new",
    createdAt: projectDate,
    attachments: [],
    contract: {
      id: "contract-demo",
      requestId: "request-demo",
      finalPrice: 58000,
      finalDurationDays: 20,
      workScope: "Айдентика, базовый бренд-гайд и подготовка стартовых носителей.",
      materials: "Логотип, палитра, типографика, визитка, обложка для соцсетей.",
      managerComment: "Финальные условия можно согласовать после передачи текстов и референсов.",
      status: "sent",
      acceptedAt: null,
      createdAt: projectDate
    }
  }
];
