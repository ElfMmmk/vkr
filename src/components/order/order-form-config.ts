import type { OrderStepId } from "@/lib/order-draft";
import type { Locale } from "@/lib/i18n";

export const contactPlaceholders: Record<string, string> = {
  Telegram: "@username",
  Email: "name@example.com",
  Телефон: "+7 999 000-00-00",
  "Другой способ": "Напишите удобный способ связи"
};

export const submitUnlockDelayMs = 2500;

export const orderSteps: Array<{ id: OrderStepId; title: string; description: string }> = [
  { id: "service", title: "Услуга", description: "Выберите направление и подходящий пакет работ." },
  { id: "extras", title: "Дополнения", description: "Добавьте услуги и проект из портфолио как ориентир." },
  { id: "brief", title: "Бриф", description: "Опишите результат, стиль и материалы." },
  { id: "contact", title: "Контакты", description: "Оставьте способ связи и приложите файлы." },
  { id: "review", title: "Проверка", description: "Проверьте сводку перед отправкой." }
];

const orderStepsEn: typeof orderSteps = [
  { id: "service", title: "Service", description: "Choose a direction and a suitable work package." },
  { id: "extras", title: "Extras", description: "Add optional work and a portfolio project as a reference." },
  { id: "brief", title: "Brief", description: "Describe the result, visual direction, and available materials." },
  { id: "contact", title: "Contact", description: "Leave your contact details and attach files." },
  { id: "review", title: "Review", description: "Check the request summary before sending." }
];

export function getOrderSteps(locale: Locale) {
  return locale === "en" ? orderStepsEn : orderSteps;
}

export const resultChips = ["логотип", "презентация", "упаковка", "шаблоны для соцсетей", "бренд-гайд"];
export const styleChips = ["минимализм", "премиально", "ярко", "строго", "как в выбранном референсе"];
export const materialChips = ["тексты есть", "нужна помощь с текстом", "есть логотип", "есть брендбук", "есть фото"];

const resultChipsEn = ["logo", "presentation", "packaging", "social media templates", "brand guide"];
const styleChipsEn = ["minimal", "premium", "bright", "strict", "similar to the selected reference"];
const materialChipsEn = ["copy is ready", "need help with copy", "logo is ready", "brand guide is ready", "photos are ready"];

export function getBriefChips(locale: Locale) {
  return locale === "en"
    ? { materialChips: materialChipsEn, resultChips: resultChipsEn, styleChips: styleChipsEn }
    : { materialChips, resultChips, styleChips };
}

export const quizQuestionOptions = {
  taskType: [
    { label: "Бренд", value: "brand" },
    { label: "Презентация", value: "presentation" },
    { label: "Соцсети", value: "social" },
    { label: "Упаковка", value: "packaging" },
    { label: "Другое", value: "other" }
  ],
  goal: [
    { label: "Запуск", value: "launch" },
    { label: "Продажи", value: "sell" },
    { label: "Обновление", value: "refresh" },
    { label: "Событие", value: "event" }
  ],
  urgency: [
    { label: "Обычный срок", value: "standard" },
    { label: "Нужно быстро", value: "fast" }
  ],
  materials: [
    { label: "Нет материалов", value: "none" },
    { label: "Часть есть", value: "partial" },
    { label: "Всё готово", value: "ready" }
  ],
  scope: [
    { label: "Одна задача", value: "single" },
    { label: "Полный цикл", value: "full" }
  ]
} as const;

const quizQuestionOptionsEn = {
  taskType: [
    { label: "Brand", value: "brand" },
    { label: "Presentation", value: "presentation" },
    { label: "Social media", value: "social" },
    { label: "Packaging", value: "packaging" },
    { label: "Other", value: "other" }
  ],
  goal: [
    { label: "Launch", value: "launch" },
    { label: "Sales", value: "sell" },
    { label: "Refresh", value: "refresh" },
    { label: "Event", value: "event" }
  ],
  urgency: [
    { label: "Standard timing", value: "standard" },
    { label: "Urgent", value: "fast" }
  ],
  materials: [
    { label: "No materials", value: "none" },
    { label: "Some materials", value: "partial" },
    { label: "Everything is ready", value: "ready" }
  ],
  scope: [
    { label: "Single task", value: "single" },
    { label: "Complete project", value: "full" }
  ]
} as const;

export function getQuizQuestionOptions(locale: Locale) {
  return locale === "en" ? quizQuestionOptionsEn : quizQuestionOptions;
}
