import { z } from "zod";

import { contactMethods, normalizeAndValidateContact } from "@/lib/contact";
import { fieldLimits } from "@/lib/field-limits";
import { requestStatuses } from "@/lib/request-status";

export const pageKeySchema = z.enum(["home", "about", "services", "contacts"]);

export const imageParentTypeSchema = z.enum(["project", "page", "service", "free"]);

export const contactMethodSchema = z.enum(contactMethods);
export const contractStatusSchema = z.enum(["draft", "sent", "revision_requested", "accepted", "cancelled"]);

export const orderRequestSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(fieldLimits.order.clientName.min, "Укажите имя")
    .max(fieldLimits.order.clientName.max, "Имя слишком длинное"),
  contactMethod: contactMethodSchema,
  contactValue: z
    .string()
    .trim()
    .min(fieldLimits.order.contactValue.min, "Укажите контакт")
    .max(fieldLimits.order.contactValue.max, "Контакт слишком длинный"),
  serviceId: z.string().trim().min(1, "Выберите услугу"),
  packageId: z.string().trim().min(1, "Выберите пакет работ"),
  addonIds: z.array(z.string().trim().min(1)).default([]),
  referenceProjectId: z.string().trim().optional(),
  serviceTitle: z.string().trim().max(fieldLimits.order.serviceTitle.max).optional(),
  resultDescription: z
    .string()
    .trim()
    .min(fieldLimits.order.resultDescription.min, "Опишите ожидаемый результат")
    .max(fieldLimits.order.resultDescription.max, "Описание слишком длинное"),
  stylePreferences: z
    .string()
    .trim()
    .min(fieldLimits.order.stylePreferences.min, "Опишите стиль или выберите пример")
    .max(fieldLimits.order.stylePreferences.max, "Описание стиля слишком длинное"),
  materials: z
    .string()
    .trim()
    .max(fieldLimits.order.materials.max, "Материалы описаны слишком подробно")
    .default(""),
  desiredDeadline: z
    .string()
    .trim()
    .max(fieldLimits.order.desiredDeadline.max, "Срок слишком длинный")
    .default(""),
  comment: z
    .string()
    .trim()
    .max(fieldLimits.order.comment.max, "Комментарий слишком длинный")
    .default("")
}).superRefine((value, context) => {
  const result = normalizeAndValidateContact(value.contactMethod, value.contactValue);

  if (!result.ok) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: result.error,
      path: ["contactValue"]
    });
  }
}).transform((value) => {
  const result = normalizeAndValidateContact(value.contactMethod, value.contactValue);

  return {
    ...value,
    contactValue: result.ok ? result.value : value.contactValue
  };
});

export const servicePackageSchema = z
  .object({
    serviceId: z.string().trim().min(1),
    title: z.string().trim().min(fieldLimits.servicePackage.title.min).max(fieldLimits.servicePackage.title.max),
    description: z.string().trim().max(fieldLimits.servicePackage.description.max).default(""),
    badge: z.string().trim().max(fieldLimits.servicePackage.badge.max).default(""),
    bestFor: z.string().trim().max(fieldLimits.servicePackage.bestFor.max).default(""),
    outcome: z.string().trim().max(fieldLimits.servicePackage.outcome.max).default(""),
    includedItems: z
      .array(z.string().trim().min(1).max(fieldLimits.servicePackage.includedItem.max))
      .max(fieldLimits.servicePackage.includedItems.max)
      .default([]),
    priceFrom: z.coerce.number().int().min(fieldLimits.servicePackage.price.min).max(fieldLimits.servicePackage.price.max),
    priceTo: z.coerce.number().int().min(fieldLimits.servicePackage.price.min).max(fieldLimits.servicePackage.price.max),
    durationFromDays: z.coerce
      .number()
      .int()
      .min(fieldLimits.servicePackage.durationDays.min)
      .max(fieldLimits.servicePackage.durationDays.max),
    durationToDays: z.coerce
      .number()
      .int()
      .min(fieldLimits.servicePackage.durationDays.min)
      .max(fieldLimits.servicePackage.durationDays.max),
    displayOrder: z.coerce
      .number()
      .int()
      .min(fieldLimits.servicePackage.displayOrder.min)
      .max(fieldLimits.servicePackage.displayOrder.max),
    isActive: z.boolean(),
    isRecommended: z.boolean().default(false)
  })
  .refine((value) => value.priceTo >= value.priceFrom, {
    message: "Максимальная цена не может быть меньше минимальной",
    path: ["priceTo"]
  })
  .refine((value) => value.durationToDays >= value.durationFromDays, {
    message: "Максимальный срок не может быть меньше минимального",
    path: ["durationToDays"]
  });

export const serviceAddonSchema = z.object({
  serviceId: z.string().trim().min(1),
  title: z.string().trim().min(fieldLimits.serviceAddon.title.min).max(fieldLimits.serviceAddon.title.max),
  description: z.string().trim().max(fieldLimits.serviceAddon.description.max).default(""),
  price: z.coerce.number().int().min(fieldLimits.serviceAddon.price.min).max(fieldLimits.serviceAddon.price.max),
  durationDays: z.coerce
    .number()
    .int()
    .min(fieldLimits.serviceAddon.durationDays.min)
    .max(fieldLimits.serviceAddon.durationDays.max),
  displayOrder: z.coerce
    .number()
    .int()
    .min(fieldLimits.serviceAddon.displayOrder.min)
    .max(fieldLimits.serviceAddon.displayOrder.max),
  isActive: z.boolean()
});

export const orderContractSchema = z.object({
  requestId: z.string().trim().min(1),
  finalPrice: z.coerce.number().int().min(fieldLimits.orderContract.finalPrice.min).max(fieldLimits.orderContract.finalPrice.max),
  finalDurationDays: z.coerce
    .number()
    .int()
    .min(fieldLimits.orderContract.finalDurationDays.min)
    .max(fieldLimits.orderContract.finalDurationDays.max),
  workScope: z
    .string()
    .trim()
    .min(fieldLimits.orderContract.workScope.min)
    .max(fieldLimits.orderContract.workScope.max),
  materials: z.string().trim().max(fieldLimits.orderContract.materials.max).default(""),
  managerComment: z.string().trim().max(fieldLimits.orderContract.managerComment.max).default(""),
  status: contractStatusSchema
});

export const serviceSchema = z.object({
  title: z.string().trim().min(fieldLimits.service.title.min).max(fieldLimits.service.title.max),
  slug: z.string().trim().min(fieldLimits.service.slug.min).max(fieldLimits.service.slug.max),
  description: z.string().trim().min(fieldLimits.service.description.min).max(fieldLimits.service.description.max),
  details: z.string().trim().max(fieldLimits.service.details.max).default(""),
  displayOrder: z.coerce.number().int().min(fieldLimits.service.displayOrder.min).max(fieldLimits.service.displayOrder.max),
  isActive: z.boolean()
});

export const tagSchema = z.object({
  title: z.string().trim().min(fieldLimits.tag.title.min).max(fieldLimits.tag.title.max),
  slug: z.string().trim().min(fieldLimits.tag.slug.min).max(fieldLimits.tag.slug.max),
  description: z.string().trim().max(fieldLimits.tag.description.max).default("")
});

export const pageSchema = z.object({
  title: z.string().trim().min(fieldLimits.page.title.min).max(fieldLimits.page.title.max),
  body: z.string().trim().min(fieldLimits.page.body.min).max(fieldLimits.page.body.max),
  blocks: z.string().trim().max(fieldLimits.page.blocks.max).optional()
});

export const projectSchema = z.object({
  title: z.string().trim().min(fieldLimits.project.title.min).max(fieldLimits.project.title.max),
  slug: z.string().trim().min(fieldLimits.project.slug.min).max(fieldLimits.project.slug.max),
  shortDescription: z.string().trim().min(fieldLimits.project.shortDescription.min).max(fieldLimits.project.shortDescription.max),
  fullDescription: z.string().trim().min(fieldLimits.project.fullDescription.min).max(fieldLimits.project.fullDescription.max),
  coverImageUrl: z.string().trim().max(fieldLimits.project.coverImageUrl.max).default(""),
  isFeatured: z.boolean(),
  isPublished: z.boolean()
});

export const imageUploadSchema = z.object({
  title: z.string().trim().max(fieldLimits.image.title.max, "Название изображения слишком длинное").default(""),
  caption: z.string().trim().max(fieldLimits.image.caption.max, "Описание изображения слишком длинное").default(""),
  sortOrder: z.coerce.number().int().min(fieldLimits.image.sortOrder.min).max(fieldLimits.image.sortOrder.max)
});

export const requestStatusSchema = z.enum(
  requestStatuses as [typeof requestStatuses[number], ...typeof requestStatuses]
);

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
