export type Locale = "ru" | "en";

export const locales: Locale[] = ["ru", "en"];
export const defaultLocale: Locale = "ru";

export const dictionaries = {
  ru: {
    nav: {
      about: "Обо мне",
      portfolio: "Портфолио",
      services: "Услуги",
      contacts: "Контакты",
      account: "Кабинет",
      order: "Оставить заявку",
      navigation: "Навигация"
    },
    common: {
      portfolio: "Портфолио",
      recentProjects: "Недавние проекты",
      allWorks: "Все работы",
      moreServices: "Смотреть другие услуги",
      projectCount: "Найдено проектов",
      resetAll: "Сбросить всё",
      resetFilters: "Сбросить фильтры",
      allServices: "Все услуги",
      allTags: "Все теги",
      selected: "Выбрано",
      serviceExamples: "Пример работ",
      order: "Заказать",
      emptyProjectsTitle: "Проекты не найдены",
      emptyProjectsText: "Сбросьте фильтр или выберите другое направление"
    }
  },
  en: {
    nav: {
      about: "About",
      portfolio: "Portfolio",
      services: "Services",
      contacts: "Contacts",
      account: "Account",
      order: "Send request",
      navigation: "Navigation"
    },
    common: {
      portfolio: "Portfolio",
      recentProjects: "Recent projects",
      allWorks: "All work",
      moreServices: "View more services",
      projectCount: "Projects found",
      resetAll: "Reset all",
      resetFilters: "Reset filters",
      allServices: "All services",
      allTags: "All tags",
      selected: "Selected",
      serviceExamples: "Work examples",
      order: "Order",
      emptyProjectsTitle: "No projects found",
      emptyProjectsText: "Reset filters or choose another direction"
    }
  }
} as const;

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "ru";
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
