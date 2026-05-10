import { z } from "zod";

import { requestStatuses } from "@/lib/request-status";

export const pageKeySchema = z.enum(["home", "about", "services", "contacts"]);

export const imageParentTypeSchema = z.enum(["project", "page", "service", "free"]);

export const orderRequestSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, "Укажите имя")
    .max(120, "Имя слишком длинное"),
  contactMethod: z
    .string()
    .trim()
    .min(2, "Укажите способ связи")
    .max(40, "Способ связи слишком длинный"),
  contactValue: z
    .string()
    .trim()
    .min(3, "Укажите контакт")
    .max(180, "Контакт слишком длинный"),
  serviceId: z.string().trim().optional(),
  serviceTitle: z.string().trim().max(160).optional(),
  comment: z
    .string()
    .trim()
    .min(10, "Опишите задачу хотя бы в одном предложении")
    .max(2000, "Комментарий слишком длинный")
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180),
  description: z.string().trim().min(5).max(800),
  details: z.string().trim().max(2000).default(""),
  displayOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean()
});

export const tagSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160),
  description: z.string().trim().max(800).default("")
});

export const pageSchema = z.object({
  title: z.string().trim().min(2).max(180),
  body: z.string().trim().min(5).max(4000),
  blocks: z.string().trim().max(8000).optional()
});

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(200),
  shortDescription: z.string().trim().min(5).max(500),
  fullDescription: z.string().trim().min(20).max(6000),
  coverImageUrl: z.string().trim().min(5).max(1200),
  isPublished: z.boolean()
});

export const requestStatusSchema = z.enum(
  requestStatuses as [typeof requestStatuses[number], ...typeof requestStatuses]
);

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
