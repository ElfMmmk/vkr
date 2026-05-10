import { expect, test } from "@playwright/test";

test("public visitor can browse portfolio and open an order form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Графический дизайн");

  await page.getByRole("link", { name: /Смотреть портфолио|Портфолио/ }).first().click();
  await expect(page).toHaveURL(/\/portfolio/);
  await expect(page.getByRole("heading", { name: "Портфолио" })).toBeVisible();

  await page.getByRole("link", { name: /Открыть/ }).first().click();
  await expect(page.getByRole("link", { name: "Заказать похожий проект" })).toBeVisible();

  await page.getByRole("link", { name: "Заказать похожий проект" }).click();
  await expect(page).toHaveURL(/\/order/);
  await expect(page.getByRole("button", { name: "Отправить заявку" })).toBeVisible();
});

test("admin login explains missing setup without Supabase env", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Вход в админку" })).toBeVisible();
  await expect(page.getByText("Для входа настройте Supabase")).toBeVisible();
});
