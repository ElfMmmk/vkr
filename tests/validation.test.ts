import { describe, expect, it } from "vitest";

import { filterProjects } from "@/lib/data/public";
import { demoProjects } from "@/lib/demo-data";
import { isRequestStatus } from "@/lib/request-status";
import { createSlug } from "@/lib/slug";
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
});
