import type { OrderStepId } from "@/lib/order-draft";

export const contactPlaceholders: Record<string, string> = {
  Telegram: "@username",
  Email: "name@example.com",
  Телефон: "+7 999 000-00-00",
  "Другой способ": "Напишите удобный способ связи"
};

export const submitUnlockDelayMs = 2500;

export const orderSteps: Array<{ id: OrderStepId; title: string; description: string }> = [
  { id: "service", title: "Услуга", description: "Выберите направление или пройдите короткий подбор." },
  { id: "package", title: "Пакет", description: "Сравните состав, стоимость и срок." },
  { id: "extras", title: "Доплаты и пример", description: "Добавьте опции и визуальный ориентир." },
  { id: "brief", title: "Бриф", description: "Опишите результат, стиль и материалы." },
  { id: "contact", title: "Контакты", description: "Оставьте способ связи и приложите файлы." },
  { id: "review", title: "Проверка", description: "Проверьте сводку перед отправкой." }
];

export const resultChips = ["логотип", "презентация", "упаковка", "шаблоны для соцсетей", "бренд-гайд"];
export const styleChips = ["минимализм", "премиально", "ярко", "строго", "как в выбранном референсе"];
export const materialChips = ["тексты есть", "нужна помощь с текстом", "есть логотип", "есть брендбук", "есть фото"];

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
