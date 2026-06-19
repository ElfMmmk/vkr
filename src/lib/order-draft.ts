export const ORDER_DRAFT_VERSION = 2;
export const ORDER_DRAFT_STORAGE_KEY = "vkr-order-draft-v2";
export const LEGACY_ORDER_DRAFT_STORAGE_KEY = "vkr-order-draft-v1";

export const orderStepIds = ["service", "extras", "brief", "contact", "review"] as const;

export type OrderStepId = typeof orderStepIds[number];

export type OrderDraftValues = {
  clientName: string;
  contactMethod: string;
  contactValue: string;
  serviceId: string;
  packageId: string;
  addonIds: string[];
  referenceProjectId: string;
  resultDescription: string;
  stylePreferences: string;
  materials: string;
  desiredDeadline: string;
  comment: string;
};

export type OrderDraftQuizAnswers = {
  taskType: string;
  goal: string;
  urgency: string;
  materials: string;
  scope: string;
};

export type OrderDraft = {
  version: typeof ORDER_DRAFT_VERSION;
  stepId: OrderStepId;
  values: OrderDraftValues;
  quizAnswers?: OrderDraftQuizAnswers;
};

export const emptyOrderDraftValues: OrderDraftValues = {
  addonIds: [],
  clientName: "",
  comment: "",
  contactMethod: "Telegram",
  contactValue: "",
  desiredDeadline: "",
  materials: "",
  packageId: "",
  referenceProjectId: "",
  resultDescription: "",
  serviceId: "",
  stylePreferences: ""
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(record: Record<string, unknown>, key: keyof OrderDraftValues): string {
  const value = record[key];

  return typeof value === "string" ? value : "";
}

function readStringArray(record: Record<string, unknown>, key: keyof OrderDraftValues): string[] {
  const value = record[key];

  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseQuizAnswers(value: unknown): OrderDraftQuizAnswers | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    goal: typeof value.goal === "string" ? value.goal : "",
    materials: typeof value.materials === "string" ? value.materials : "",
    scope: typeof value.scope === "string" ? value.scope : "",
    taskType: typeof value.taskType === "string" ? value.taskType : "",
    urgency: typeof value.urgency === "string" ? value.urgency : ""
  };
}

export function parseOrderDraft(raw: string | null | undefined): OrderDraft | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      !isRecord(parsed)
      || (parsed.version !== ORDER_DRAFT_VERSION && parsed.version !== 1)
      || !isRecord(parsed.values)
    ) {
      return null;
    }

    const legacyStepMap: Record<string, OrderStepId> = {
      service: "service",
      package: "service",
      extras: "extras",
      brief: "brief",
      contact: "contact",
      review: "review"
    };
    const stepId = typeof parsed.stepId === "string"
      ? legacyStepMap[parsed.stepId] ?? "service"
      : "service";

    return {
      version: ORDER_DRAFT_VERSION,
      stepId,
      values: {
        addonIds: readStringArray(parsed.values, "addonIds"),
        clientName: readString(parsed.values, "clientName"),
        comment: readString(parsed.values, "comment"),
        contactMethod: readString(parsed.values, "contactMethod") || "Telegram",
        contactValue: readString(parsed.values, "contactValue"),
        desiredDeadline: readString(parsed.values, "desiredDeadline"),
        materials: readString(parsed.values, "materials"),
        packageId: readString(parsed.values, "packageId"),
        referenceProjectId: readString(parsed.values, "referenceProjectId"),
        resultDescription: readString(parsed.values, "resultDescription"),
        serviceId: readString(parsed.values, "serviceId"),
        stylePreferences: readString(parsed.values, "stylePreferences")
      },
      quizAnswers: parseQuizAnswers(parsed.quizAnswers)
    };
  } catch {
    return null;
  }
}

export function appendBriefChip(currentValue: string, chip: string): string {
  const cleanChip = chip.trim();
  const cleanCurrent = currentValue.trim();

  if (!cleanChip) {
    return cleanCurrent;
  }

  if (!cleanCurrent) {
    return cleanChip;
  }

  const parts = cleanCurrent
    .split(/[,;\n]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (parts.includes(cleanChip.toLowerCase())) {
    return cleanCurrent;
  }

  const normalizedCurrent = cleanCurrent.replace(/[;,]\s*$/, "");
  const separator = /[.!?]$/.test(normalizedCurrent) ? " " : ", ";

  return `${normalizedCurrent}${separator}${cleanChip}`;
}
