import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = [
  "/",
  "/portfolio",
  "/portfolio/studio-frame",
  "/services",
  "/order",
  "/account/login",
  "/account/register",
  "/privacy"
];

test.describe("WCAG smoke audit", () => {
  for (const route of publicRoutes) {
    test(`axe scan has no serious violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const blockingViolations = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? "")
      );

      expect(blockingViolations).toEqual([]);
    });
  }

  test("skip link moves keyboard focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "К содержанию" })).toBeFocused();
    await page.keyboard.press("Enter");

    expect(await page.locator("#main-content").evaluate((element) => element.id)).toBe("main-content");
  });

  test("admin reorder controls have keyboard alternatives", async ({ page }) => {
    await page.goto("/admin/login");
    const demoLoginButton = page.getByRole("button", { name: "Войти в demo admin" });

    test.skip(
      !(await demoLoginButton.isVisible()),
      "Preview demo login is hidden on the currently reused Supabase dev server."
    );

    await demoLoginButton.click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/projects");

    await expect(page.getByRole("button", { name: /Поднять проект/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Опустить проект/ }).first()).toBeVisible();
  });
});
