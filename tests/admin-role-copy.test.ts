import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("shared admin role copy", () => {
  it("uses neutral service-panel terminology for admin and manager login", () => {
    const loginForm = readSource("src/components/login-form.tsx");
    const loginPage = readSource("src/app/admin/login/page.tsx");
    const shell = readSource("src/components/admin-shell.tsx");

    expect(loginForm).toContain('label="Email"');
    expect(loginForm).not.toContain("Email администратора");
    expect(loginPage).toContain("служебную панель");
    expect(loginPage).not.toContain("управлению контентом сайта");
    expect(shell).toContain("Служебная панель");
    expect(shell).not.toContain("Панель администратора");
  });

  it("shows role-aware dashboard copy and a visible access-denied notice", () => {
    const dashboard = readSource("src/app/admin/(protected)/page.tsx");
    const auth = readSource("src/lib/auth.ts");

    expect(dashboard).toContain('admin.role === "manager"');
    expect(dashboard).toContain("Работа с заказами");
    expect(dashboard).toContain("Недостаточно прав");
    expect(auth).toContain('redirect("/admin?notice=content-access-denied")');
  });
});
