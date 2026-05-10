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
    isActive: true
  },
  {
    id: "svc-social",
    title: "Дизайн социальных сетей",
    slug: "social-media",
    description: "Шаблоны постов, обложки, рекламные макеты и визуальная сетка.",
    details: "Помогает сделать коммуникацию в соцсетях узнаваемой и регулярной.",
    displayOrder: 20,
    isActive: true
  },
  {
    id: "svc-packaging",
    title: "Упаковка и полиграфия",
    slug: "packaging-print",
    description: "Этикетки, упаковка, визитки, буклеты и печатные материалы.",
    details: "Готовится с учётом технических ограничений печати.",
    displayOrder: 30,
    isActive: true
  },
  {
    id: "svc-presentation",
    title: "Презентации",
    slug: "presentation-design",
    description: "Структура и визуальное оформление коммерческих и экспертных презентаций.",
    details: "Фокус на ясности, ритме слайдов и убедительной подаче.",
    displayOrder: 40,
    isActive: true
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

export const demoProjects: Project[] = [
  {
    id: "project-botanica",
    title: "Botanica Lab",
    slug: "botanica-lab",
    shortDescription: "Айдентика и упаковка для камерной линейки натуральной косметики.",
    fullDescription:
      "Задача проекта заключалась в том, чтобы соединить лабораторную чистоту и мягкую природную эстетику. В результате появилась система с лаконичным знаком, спокойной палитрой и гибкими макетами для упаковки.",
    coverImageUrl: "/assets/botanica-lab-cover.png",
    isPublished: true,
    createdAt: projectDate,
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
    coverImageUrl:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
    isPublished: true,
    createdAt: projectDate,
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
    coverImageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    isPublished: true,
    createdAt: projectDate,
    services: [demoServices[1]],
    tags: [demoTags[1], demoTags[3]],
    gallery: []
  },
  {
    id: "project-forum",
    title: "Urban Forum Deck",
    slug: "urban-forum-deck",
    shortDescription: "Презентация для городского образовательного форума.",
    fullDescription:
      "Слайды были перестроены вокруг ясного сценария выступления. Визуальный язык сочетает крупную типографику, карты, фотографии и спокойные акцентные блоки.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    isPublished: true,
    createdAt: projectDate,
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
    comment: "Нужна визуальная система для запуска новой студии.",
    status: "new",
    createdAt: projectDate
  }
];
