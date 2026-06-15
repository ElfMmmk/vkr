import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { demoProjects, demoServices } from "@/lib/demo-data";

function readPngDimensions(publicUrl: string): { width: number; height: number } {
  const bytes = readFileSync(join(process.cwd(), "public", publicUrl));

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

describe("demo catalog", () => {
  it("contains five services with three packages and two add-ons each", () => {
    expect(demoServices).toHaveLength(5);

    for (const service of demoServices) {
      expect(service.packages).toHaveLength(3);
      expect(service.addons).toHaveLength(2);
      expect(service.packages.filter((item) => item.isRecommended)).toHaveLength(1);
    }
  });

  it("contains ten published projects with local covers and galleries", () => {
    expect(demoProjects).toHaveLength(10);

    for (const project of demoProjects) {
      expect(project.isPublished).toBe(true);
      expect(project.coverImageUrl).toMatch(/^\/assets\/demo-projects\//);
      expect(project.gallery.length).toBeGreaterThanOrEqual(1);
      expect(project.gallery.every((image) => image.publicUrl.startsWith("/assets/demo-projects/"))).toBe(true);
    }

  });

  it("uses unique high-resolution images for project covers and galleries", () => {
    for (const project of demoProjects) {
      const urls = [project.coverImageUrl, ...project.gallery.map((image) => image.publicUrl)];

      expect(new Set(urls).size).toBe(urls.length);

      for (const url of urls) {
        expect(url, project.slug).toMatch(/-v2\.png$/);

        const dimensions = readPngDimensions(url);

        expect(dimensions.width, url).toBeGreaterThanOrEqual(1000);
        expect(dimensions.height, url).toBeGreaterThanOrEqual(1000);
      }
    }
  });
});
