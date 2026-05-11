import { describe, expect, it } from "vitest";

import { filterProjects } from "@/lib/data/public";
import { demoProjects } from "@/lib/demo-data";
import { isRequestStatus } from "@/lib/request-status";
import { createSlug } from "@/lib/slug";
import {
  MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES,
  getPortfolioImageExtension,
  validatePortfolioImageBytes,
  validatePortfolioImageUpload
} from "@/lib/uploads";
import {
  imageParentTypeSchema,
  orderRequestSchema,
  pageKeySchema
} from "@/lib/validation";

describe("validation helpers", () => {
  it("accepts a valid order request", () => {
    const result = orderRequestSchema.safeParse({
      clientName: "Анна",
      contactMethod: "Telegram",
      contactValue: "@anna",
      serviceId: "svc-brand",
      comment: "Нужна айдентика для небольшого бренда косметики."
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty order request", () => {
    const result = orderRequestSchema.safeParse({
      clientName: "",
      contactMethod: "",
      contactValue: "",
      comment: ""
    });

    expect(result.success).toBe(false);
  });

  it("creates stable latin slugs from russian titles", () => {
    expect(createSlug("Айдентика бренда")).toBe("aydentika-brenda");
    expect(createSlug("North Coffee Roasters")).toBe("north-coffee-roasters");
  });

  it("keeps request statuses constrained", () => {
    expect(isRequestStatus("new")).toBe(true);
    expect(isRequestStatus("archived")).toBe(false);
  });

  it("keeps admin hidden/select values constrained", () => {
    expect(pageKeySchema.safeParse("contacts").success).toBe(true);
    expect(pageKeySchema.safeParse("admin").success).toBe(false);
    expect(imageParentTypeSchema.safeParse("project").success).toBe(true);
    expect(imageParentTypeSchema.safeParse("script").success).toBe(false);
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

    expect(filteredProjects.map((project) => project.slug)).toEqual(["urban-forum-deck"]);
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
