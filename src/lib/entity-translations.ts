import { fieldLimits } from "@/lib/field-limits";

export const translationEntityTypes = [
  "page",
  "service",
  "service_package",
  "service_addon",
  "project",
  "tag",
  "image"
] as const;

export type TranslationEntityType = (typeof translationEntityTypes)[number];
export type EntityTranslationFields = Record<
  string,
  string | string[] | Record<string, string>
>;

type ScalarFieldDefinition = {
  kind: "string";
  max: number;
};

type StringArrayFieldDefinition = {
  kind: "stringArray";
  maxItems: number;
  maxItemLength: number;
};

type BlocksFieldDefinition = {
  kind: "blocks";
  maxItemLength: number;
};

type FieldDefinition =
  | ScalarFieldDefinition
  | StringArrayFieldDefinition
  | BlocksFieldDefinition;

const fieldDefinitions: Record<TranslationEntityType, Record<string, FieldDefinition>> = {
  page: {
    title: { kind: "string", max: fieldLimits.page.title.max },
    body: { kind: "string", max: fieldLimits.page.body.max },
    blocks: { kind: "blocks", maxItemLength: fieldLimits.pageBlock.value.max }
  },
  service: {
    title: { kind: "string", max: fieldLimits.service.title.max },
    description: { kind: "string", max: fieldLimits.service.description.max },
    details: { kind: "string", max: fieldLimits.service.details.max }
  },
  service_package: {
    title: { kind: "string", max: fieldLimits.servicePackage.title.max },
    description: { kind: "string", max: fieldLimits.servicePackage.description.max },
    badge: { kind: "string", max: fieldLimits.servicePackage.badge.max },
    bestFor: { kind: "string", max: fieldLimits.servicePackage.bestFor.max },
    outcome: { kind: "string", max: fieldLimits.servicePackage.outcome.max },
    includedItems: {
      kind: "stringArray",
      maxItems: fieldLimits.servicePackage.includedItems.max,
      maxItemLength: fieldLimits.servicePackage.includedItem.max
    }
  },
  service_addon: {
    title: { kind: "string", max: fieldLimits.serviceAddon.title.max },
    description: { kind: "string", max: fieldLimits.serviceAddon.description.max }
  },
  project: {
    title: { kind: "string", max: fieldLimits.project.title.max },
    shortDescription: { kind: "string", max: fieldLimits.project.shortDescription.max },
    fullDescription: { kind: "string", max: fieldLimits.project.fullDescription.max }
  },
  tag: {
    title: { kind: "string", max: fieldLimits.tag.title.max },
    description: { kind: "string", max: fieldLimits.tag.description.max }
  },
  image: {
    title: { kind: "string", max: fieldLimits.image.title.max },
    caption: { kind: "string", max: fieldLimits.image.caption.max }
  }
};

function parsePayloadRecord(payload: unknown): Record<string, unknown> {
  if (typeof payload === "string") {
    if (!payload.trim()) {
      return {};
    }

    try {
      const parsed: unknown = JSON.parse(payload);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      throw new Error("Некорректные данные английского перевода.");
    }

    throw new Error("Некорректные данные английского перевода.");
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  if (payload === null || payload === undefined) {
    return {};
  }

  throw new Error("Некорректные данные английского перевода.");
}

function parseStringField(key: string, value: unknown, max: number): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (normalized.length > max) {
    throw new Error(`Английский перевод поля «${key}» превышает допустимую длину.`);
  }

  return normalized;
}

function parseStringArrayField(
  key: string,
  value: unknown,
  definition: StringArrayFieldDefinition
): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : [];
  const normalized = items
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length > definition.maxItems) {
    throw new Error(`Английский перевод поля «${key}» содержит слишком много элементов.`);
  }

  for (const item of normalized) {
    if (item.length > definition.maxItemLength) {
      throw new Error(`Английский перевод поля «${key}» превышает допустимую длину.`);
    }
  }

  return normalized;
}

function parseBlocksField(value: unknown, maxItemLength: number): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, blockValue]) => {
        const normalized = blockValue.trim();

        if (normalized.length > maxItemLength) {
          throw new Error(`Английский перевод блока «${key}» превышает допустимую длину.`);
        }

        return [key, normalized];
      })
  );
}

export function parseEntityTranslationPayload(
  entityType: TranslationEntityType,
  payload: unknown
): EntityTranslationFields {
  const record = parsePayloadRecord(payload);
  const definitions = fieldDefinitions[entityType];

  return Object.fromEntries(
    Object.entries(definitions).map(([key, definition]) => {
      const value = record[key];

      if (definition.kind === "string") {
        return [key, parseStringField(key, value, definition.max)];
      }

      if (definition.kind === "stringArray") {
        return [key, parseStringArrayField(key, value, definition)];
      }

      return [key, parseBlocksField(value, definition.maxItemLength)];
    })
  );
}

export function isEntityTranslationEmpty(fields: EntityTranslationFields): boolean {
  return Object.values(fields).every((value) => {
    if (typeof value === "string") {
      return !value.trim();
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return Object.values(value).every((item) => !item.trim());
  });
}

export function getTranslationString(
  fields: Record<string, unknown> | undefined,
  key: string
): string {
  const value = fields?.[key];

  return typeof value === "string" ? value.trim() : "";
}

export function getTranslationStringArray(
  fields: Record<string, unknown> | undefined,
  key: string
): string[] {
  const value = fields?.[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

export function getTranslationBlocks(
  fields: Record<string, unknown> | undefined
): Record<string, string> {
  const value = fields?.blocks;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, blockValue]) => [key, blockValue.trim()])
  );
}
