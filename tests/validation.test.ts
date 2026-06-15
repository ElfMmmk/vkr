import { describe, expect, it } from "vitest";

import { filterProjects } from "@/lib/data/public";
import { demoProjects } from "@/lib/demo-data";
import {
  calculateOrderEstimate,
  formatDurationRange,
  formatPriceRange,
  getOrderAddonTotals,
  getOrderBaseEstimate
} from "@/lib/order-calculator";
import {
  formatRequestStatusChangeBody,
  isRequestStatus,
  requestStatusLabels,
  requestStatuses
} from "@/lib/request-status";
import type { OrderRequest } from "@/lib/types";
import { createSlug } from "@/lib/slug";
import { fieldLimits } from "@/lib/field-limits";
import {
  MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES,
  getPortfolioImageExtension,
  validatePortfolioImageBytes,
  validatePortfolioImageUpload
} from "@/lib/uploads";
import {
  imageUploadSchema,
  imageParentTypeSchema,
  orderRequestSchema,
  pageKeySchema,
  servicePackageSchema
} from "@/lib/validation";
import {
  formatContactInput,
  normalizeAndValidateContact
} from "@/lib/contact";

describe("validation helpers", () => {
  it("accepts a valid order request", () => {
    const result = orderRequestSchema.safeParse({
      clientName: "Анна",
      contactMethod: "Telegram",
      contactValue: "@anna_design",
      serviceId: "svc-brand",
      packageId: "pkg-brand-start",
      addonIds: ["addon-brand-guide"],
      referenceProjectId: "project-botanica",
      resultDescription: "Нужна айдентика для небольшого бренда косметики.",
      stylePreferences: "Минималистично, спокойно, с натуральной палитрой.",
      materials: "Есть название и фотографии продукта.",
      desiredDeadline: "До конца месяца"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty order request", () => {
    const result = orderRequestSchema.safeParse({
      clientName: "",
      contactMethod: "",
      contactValue: "",
      serviceId: "",
      packageId: "",
      resultDescription: "",
      stylePreferences: ""
    });

    expect(result.success).toBe(false);
  });

  it("normalizes and validates contacts according to the selected method", () => {
    expect(normalizeAndValidateContact("Email", "  MARIA@Example.COM ")).toEqual({
      ok: true,
      value: "maria@example.com"
    });
    expect(normalizeAndValidateContact("Telegram", "maria_design")).toEqual({
      ok: true,
      value: "@maria_design"
    });
    expect(normalizeAndValidateContact("Телефон", "89991234567")).toEqual({
      ok: true,
      value: "+7 999 123-45-67"
    });
    expect(normalizeAndValidateContact("Телефон", "123")).toEqual({
      ok: false,
      error: "Укажите корректный номер телефона"
    });
    expect(formatContactInput("Телефон", "89991234567")).toBe("+7 999 123-45-67");
  });

  it("calculates package and add-on estimates", () => {
    const estimate = calculateOrderEstimate({
      package: {
        priceFrom: 25000,
        priceTo: 45000,
        durationFromDays: 10,
        durationToDays: 18
      },
      addons: [
        { price: 18000, durationDays: 5 },
        { price: 12000, durationDays: 0 }
      ]
    });

    expect(estimate).toEqual({
      priceFrom: 55000,
      priceTo: 75000,
      durationFromDays: 15,
      durationToDays: 23
    });
  });

  it("breaks request estimates into package base and add-on totals", () => {
    const request = {
      packagePriceFrom: 37000,
      packagePriceTo: 50000,
      packageDurationFromDays: 11,
      packageDurationToDays: 15,
      selectedAddons: [
        { id: "addon-fast", title: "Срочность", description: "", price: 18000, durationDays: 5 },
        { id: "addon-templates", title: "Шаблоны", description: "", price: 15000, durationDays: 4 }
      ]
    } as OrderRequest;

    expect(getOrderBaseEstimate(request)).toEqual({
      priceFrom: 37000,
      priceTo: 50000,
      durationFromDays: 11,
      durationToDays: 15
    });
    expect(getOrderAddonTotals(request.selectedAddons)).toEqual({
      price: 33000,
      durationDays: 9
    });
  });

  it("formats price and duration ranges with spaced dashes", () => {
    expect(formatPriceRange(25000, 45000)).toBe("25 000 ₽ – 45 000 ₽");
    expect(formatDurationRange(10, 18)).toBe("10 – 18 раб. дн.");
  });

  it("creates stable latin slugs from russian titles", () => {
    expect(createSlug("Айдентика бренда")).toBe("aydentika-brenda");
    expect(createSlug("North Coffee Roasters")).toBe("north-coffee-roasters");
  });

  it("keeps request statuses constrained", () => {
    expect(isRequestStatus("new")).toBe(true);
    expect(isRequestStatus("in_work")).toBe(true);
    expect(requestStatuses).toEqual([
      "new",
      "in_progress",
      "approved",
      "in_work",
      "completed",
      "rejected"
    ]);
    expect(requestStatusLabels.in_progress).toBe("В обработке");
    expect(requestStatusLabels.in_work).toBe("В работе");
    expect(formatRequestStatusChangeBody("in_work")).toBe("Заявка переведена в статус «В работе».");
    expect(isRequestStatus("archived")).toBe(false);
  });

  it("rejects inconsistent package pricing and timing", () => {
    const result = servicePackageSchema.safeParse({
      serviceId: "svc-brand",
      title: "Wrong",
      description: "",
      priceFrom: "50000",
      priceTo: "25000",
      durationFromDays: "20",
      durationToDays: "10",
      displayOrder: "10",
      isActive: true
    });

    expect(result.success).toBe(false);
  });

  it("keeps admin hidden/select values constrained", () => {
    expect(pageKeySchema.safeParse("contacts").success).toBe(true);
    expect(pageKeySchema.safeParse("admin").success).toBe(false);
    expect(imageParentTypeSchema.safeParse("project").success).toBe(true);
    expect(imageParentTypeSchema.safeParse("script").success).toBe(false);
  });

  it("shares field limits between schemas and form controls", () => {
    expect(fieldLimits.project.fullDescription.max).toBe(6000);
    expect(
      imageUploadSchema.safeParse({
        title: "x".repeat(fieldLimits.image.title.max + 1),
        caption: "",
        sortOrder: "100"
      }).success
    ).toBe(false);
    expect(
      imageUploadSchema.safeParse({
        title: "Обложка",
        caption: "Короткое описание",
        sortOrder: "100"
      }).success
    ).toBe(true);
  });

  it("filters public projects by service and tag", () => {
    const brandProjects = filterProjects(demoProjects, { service: "brand-identity" });
    const digitalProjects = filterProjects(demoProjects, { tag: "digital" });

    expect(brandProjects.map((project) => project.slug)).toContain("botanica-lab");
    expect(digitalProjects.every((project) => project.tags.some((tag) => tag.slug === "digital"))).toBe(true);
  });

  it("filters public projects by multiple values and sorts by date", () => {
    const filteredProjects = filterProjects(demoProjects, {
      services: ["brand-identity", "presentation-design"],
      tags: ["digital"],
      sort: "newest"
    });
    const oldestProjects = filterProjects(demoProjects, { sort: "oldest" });

    expect(filteredProjects.map((project) => project.slug)).toContain("urban-forum-deck");
    expect(
      filteredProjects.every(
        (project) =>
          project.tags.some((tag) => tag.slug === "digital")
          && project.services.some((service) =>
            ["brand-identity", "presentation-design"].includes(service.slug)
          )
      )
    ).toBe(true);
    expect(oldestProjects[0]?.slug).toBe("studio-frame");
  });

  it("keeps portfolio image uploads within free plan constraints", () => {
    expect(
      validatePortfolioImageUpload({
        name: "cover.webp",
        size: 1024,
        type: "image/webp"
      })
    ).toBeNull();
    expect(
      validatePortfolioImageUpload({
        name: "cover.svg",
        size: 1024,
        type: "image/svg+xml"
      })
    ).toContain("JPEG");
    expect(
      validatePortfolioImageUpload({
        name: "cover.jpg",
        size: MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES + 1,
        type: "image/jpeg"
      })
    ).toContain("10 МБ");
    expect(getPortfolioImageExtension({ name: "cover.jpeg", size: 1024, type: "image/jpeg" })).toBe("jpg");
  });

  it("rejects mismatched image byte signatures", () => {
    const fakePng = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]).buffer;
    const realPng = new Uint8Array([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a
    ]).buffer;

    expect(
      validatePortfolioImageBytes({ name: "cover.png", size: 1024, type: "image/png" }, fakePng)
    ).toContain("PNG");
    expect(
      validatePortfolioImageBytes({ name: "cover.png", size: 1024, type: "image/png" }, realPng)
    ).toBeNull();
  });
});
