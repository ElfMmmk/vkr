import { catalogProjects, catalogServices, catalogTags } from "@/lib/demo-catalog";
import type { OrderRequest, PageContent } from "@/lib/types";

export const demoServices = catalogServices;
export const demoTags = catalogTags;
export const demoProjects = catalogProjects;

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
      telegram: "@portfolio_contact"
    }
  }
];

const projectDate = "2026-05-10T00:00:00.000Z";

export const demoRequests: OrderRequest[] = [
  {
    id: "request-demo",
    clientName: "Мария",
    contactMethod: "Telegram",
    contactValue: "@client",
    serviceId: "svc-brand",
    serviceTitle: "Айдентика бренда",
    packageId: "pkg-brand-logo",
    packageTitle: "Логотип",
    packageDescription: "Знак, цветовая палитра и базовые варианты использования.",
    packagePriceFrom: 25000,
    packagePriceTo: 45000,
    packageDurationFromDays: 10,
    packageDurationToDays: 18,
    selectedAddons: [
      {
        id: "addon-brand-naming",
        title: "Подбор названия",
        description: "Варианты названия с проверкой смысла и звучания.",
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
      createdAt: projectDate,
      feedback: []
    }
  }
];
