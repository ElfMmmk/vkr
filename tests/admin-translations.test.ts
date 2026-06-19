import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("bilingual admin editors", () => {
  it("provides a reusable RU and EN text editor that submits one English payload", () => {
    const component = readSource("src/components/admin-translated-fields.tsx");

    expect(component).toContain('aria-label="Язык редактирования"');
    expect(component).toContain(">RU<");
    expect(component).toContain(">EN<");
    expect(component).toContain('name="englishTranslation"');
  });

  it("uses bilingual text controls for all public entity editors", () => {
    const files = [
      "src/app/admin/(protected)/services/page.tsx",
      "src/app/admin/(protected)/projects/page.tsx",
      "src/app/admin/(protected)/tags/page.tsx",
      "src/app/admin/(protected)/images/page.tsx"
    ];

    for (const file of files) {
      expect(readSource(file)).toContain("<AdminTranslatedFields");
    }

    const pageForm = readSource("src/components/admin-page-form.tsx");
    expect(pageForm).toContain("<AdminLocaleTabs");
    expect(pageForm).toContain('name="englishTranslation"');
  });

  it("loads and persists English entity translations through authenticated server code", () => {
    const adminData = readSource("src/lib/data/admin.ts");
    const actions = readSource("src/lib/actions/admin.ts");

    expect(adminData).toContain('.from("entity_translations")');
    expect(actions).toContain("saveEnglishTranslation");
    expect(actions).toContain('formString(formData, "englishTranslation")');
    expect(actions).toContain("saveImageTextAction");
  });

  it("removes translations when their base entities are deleted", () => {
    const actions = readSource("src/lib/actions/admin.ts");

    expect(actions).toContain("deleteEntityTranslations");
    expect(actions).toContain('"service_package"');
    expect(actions).toContain('"service_addon"');
    expect(actions).toContain('"project"');
    expect(actions).toContain('"tag"');
    expect(actions).toContain('"image"');
  });
});
