import { describe, expect, it } from "vitest";

import {
  isEntityTranslationEmpty,
  parseEntityTranslationPayload,
  translationEntityTypes
} from "@/lib/entity-translations";

describe("entity translation payloads", () => {
  it("supports every public content entity requested by the editor", () => {
    expect(translationEntityTypes).toEqual([
      "page",
      "service",
      "service_package",
      "service_addon",
      "project",
      "tag",
      "image"
    ]);
  });

  it("keeps only supported normalized service-package fields", () => {
    expect(
      parseEntityTranslationPayload(
        "service_package",
        JSON.stringify({
          title: "  Identity System  ",
          description: "  Complete visual system. ",
          badge: "",
          bestFor: "  Product launch ",
          outcome: " Launch-ready identity ",
          includedItems: [" Logo ", "", "Brand guide"],
          priceFrom: "must not be translated"
        })
      )
    ).toEqual({
      title: "Identity System",
      description: "Complete visual system.",
      badge: "",
      bestFor: "Product launch",
      outcome: "Launch-ready identity",
      includedItems: ["Logo", "Brand guide"]
    });
  });

  it("normalizes translated page blocks while preserving shared keys", () => {
    expect(
      parseEntityTranslationPayload("page", {
        title: " About ",
        body: " Studio story ",
        blocks: {
          heroTitle: " Clear design ",
          empty: " ",
          nested: { unsafe: true }
        }
      })
    ).toEqual({
      title: "About",
      body: "Studio story",
      blocks: {
        heroTitle: "Clear design",
        empty: ""
      }
    });
  });

  it("treats empty strings, arrays and page blocks as an empty translation", () => {
    expect(
      isEntityTranslationEmpty({
        title: "",
        body: " ",
        blocks: { heroTitle: "" },
        includedItems: []
      })
    ).toBe(true);
    expect(isEntityTranslationEmpty({ title: "English title" })).toBe(false);
  });

  it("rejects invalid JSON and overlong translated fields", () => {
    expect(() => parseEntityTranslationPayload("service", "{broken")).toThrow(
      "Некорректные данные английского перевода."
    );
    expect(() =>
      parseEntityTranslationPayload("tag", {
        title: "x".repeat(121)
      })
    ).toThrow("Английский перевод поля «title» превышает допустимую длину.");
  });
});
