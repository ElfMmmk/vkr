import type { Service } from "@/lib/types";

export type OrderQuizAnswers = {
  taskType: "brand" | "presentation" | "social" | "packaging" | "other";
  goal: "launch" | "sell" | "refresh" | "event";
  urgency: "standard" | "fast";
  materials: "none" | "partial" | "ready";
  scope: "single" | "full";
};

export type OrderQuizRecommendation = {
  serviceId: string;
  packageId: string;
};

const taskServiceSlug: Record<OrderQuizAnswers["taskType"], string[]> = {
  brand: ["brand-identity", "identity", "branding"],
  other: [],
  packaging: ["packaging", "brand-identity"],
  presentation: ["presentation-design", "presentation"],
  social: ["social-media", "digital", "brand-identity"]
};

function findServiceForAnswers(answers: OrderQuizAnswers, services: Service[]): Service | undefined {
  const candidates = taskServiceSlug[answers.taskType];

  return (
    candidates
      .map((slug) => services.find((service) => service.isActive && service.slug.includes(slug)))
      .find(Boolean) ??
    services.find((service) => service.isActive)
  );
}

export function recommendOrderSetup(
  answers: OrderQuizAnswers,
  services: Service[]
): OrderQuizRecommendation | null {
  const service = findServiceForAnswers(answers, services);
  const packageItem = service?.packages
    .filter((item) => item.isActive)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)[0];

  if (!service || !packageItem) {
    return null;
  }

  return {
    packageId: packageItem.id,
    serviceId: service.id
  };
}

export function quizAnswersToBrief(answers: OrderQuizAnswers): string {
  const taskLabels: Record<OrderQuizAnswers["taskType"], string> = {
    brand: "бренд или айдентика",
    other: "дизайн-задача",
    packaging: "упаковка или носители",
    presentation: "презентация",
    social: "материалы для соцсетей"
  };
  const goalLabels: Record<OrderQuizAnswers["goal"], string> = {
    event: "для события или выступления",
    launch: "для запуска",
    refresh: "для обновления визуального образа",
    sell: "для продаж и презентации предложения"
  };
  const materialLabels: Record<OrderQuizAnswers["materials"], string> = {
    none: "материалы нужно подготовить с нуля",
    partial: "часть материалов уже есть",
    ready: "исходные материалы готовы"
  };

  return `Задача: ${taskLabels[answers.taskType]} ${goalLabels[answers.goal]}; ${materialLabels[answers.materials]}.`;
}
