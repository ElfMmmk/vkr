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

export type PackageRecommendationTags = {
  goal?: Array<OrderQuizAnswers["goal"]>;
  materials?: Array<OrderQuizAnswers["materials"]>;
  scope?: Array<OrderQuizAnswers["scope"]>;
  taskType?: Array<OrderQuizAnswers["taskType"]>;
  urgency?: Array<OrderQuizAnswers["urgency"]>;
};

export const orderQuizAnswerValues = {
  goal: ["launch", "sell", "refresh", "event"],
  materials: ["none", "partial", "ready"],
  scope: ["single", "full"],
  taskType: ["brand", "presentation", "social", "packaging", "other"],
  urgency: ["standard", "fast"]
} as const satisfies {
  [Key in keyof OrderQuizAnswers]: readonly OrderQuizAnswers[Key][];
};

export const orderQuizAnswerKeys = Object.keys(orderQuizAnswerValues) as Array<keyof OrderQuizAnswers>;

const packageRecommendationWeights: Record<keyof OrderQuizAnswers, number> = {
  goal: 3,
  materials: 2,
  scope: 3,
  taskType: 4,
  urgency: 2
};

const taskServiceSlug: Record<OrderQuizAnswers["taskType"], string[]> = {
  brand: ["brand-identity", "identity", "branding"],
  other: [],
  packaging: ["packaging", "brand-identity"],
  presentation: ["presentation-design", "presentation"],
  social: ["social-media", "digital", "brand-identity"]
};

function isQuizAnswerValue<Key extends keyof OrderQuizAnswers>(
  key: Key,
  value: string
): value is OrderQuizAnswers[Key] {
  return (orderQuizAnswerValues[key] as readonly string[]).includes(value);
}

export function buildPackageRecommendationTags(
  values: Partial<Record<keyof OrderQuizAnswers, string[]>>
): PackageRecommendationTags {
  const tags: PackageRecommendationTags = {};

  for (const key of orderQuizAnswerKeys) {
    const selected = Array.from(new Set(values[key] ?? []))
      .map((value) => value.trim())
      .filter((value) => isQuizAnswerValue(key, value));

    if (selected.length) {
      if (key === "goal") {
        tags.goal = selected as PackageRecommendationTags["goal"];
      } else if (key === "materials") {
        tags.materials = selected as PackageRecommendationTags["materials"];
      } else if (key === "scope") {
        tags.scope = selected as PackageRecommendationTags["scope"];
      } else if (key === "taskType") {
        tags.taskType = selected as PackageRecommendationTags["taskType"];
      } else {
        tags.urgency = selected as PackageRecommendationTags["urgency"];
      }
    }
  }

  return tags;
}

export function normalizePackageRecommendationTags(value: unknown): PackageRecommendationTags {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Partial<Record<keyof OrderQuizAnswers, unknown>>;
  const values: Partial<Record<keyof OrderQuizAnswers, string[]>> = {};

  for (const key of orderQuizAnswerKeys) {
    const rawValues = record[key];

    if (Array.isArray(rawValues)) {
      values[key] = rawValues.filter((item): item is string => typeof item === "string");
    }
  }

  return buildPackageRecommendationTags(values);
}

export function scorePackageRecommendation(
  tags: PackageRecommendationTags,
  answers: OrderQuizAnswers
): number {
  return orderQuizAnswerKeys.reduce((score, key) => {
    const values = tags[key] as string[] | undefined;

    return values?.includes(answers[key]) ? score + packageRecommendationWeights[key] : score;
  }, 0);
}

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
  const packageRecommendation = services
    .filter((service) => service.isActive)
    .flatMap((service) =>
      service.packages
        .filter((item) => item.isActive)
        .map((packageItem) => ({
          packageItem,
          score: scorePackageRecommendation(packageItem.recommendationTags, answers),
          service
        }))
    )
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      if (a.packageItem.isRecommended !== b.packageItem.isRecommended) {
        return a.packageItem.isRecommended ? -1 : 1;
      }

      if (a.service.displayOrder !== b.service.displayOrder) {
        return a.service.displayOrder - b.service.displayOrder;
      }

      return a.packageItem.displayOrder - b.packageItem.displayOrder;
    })[0];

  if (packageRecommendation) {
    return {
      packageId: packageRecommendation.packageItem.id,
      serviceId: packageRecommendation.service.id
    };
  }

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
