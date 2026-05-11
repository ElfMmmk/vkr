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

test("services page keeps service ctas compact", async ({ page }) => {
  await page.goto("/services");
  const serviceCta = page.getByRole("link", { name: "Работы" }).first();

  await expect(serviceCta).toBeVisible();

  const box = await serviceCta.boundingBox();
  expect(box?.height).toBeLessThan(70);
  expect(box?.width).toBeGreaterThan(80);
});

test("contacts page wraps contact values at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 883, height: 702 });
  await page.goto("/contacts");

  const email = page.getByText("designer@example.com");
  const telegram = page.getByText("@design_portfolio");

  await expect(email).toBeVisible();
  await expect(telegram).toBeVisible();

  for (const locator of [email, telegram]) {
    const childBox = await locator.boundingBox();
    const parentBox = await locator.locator("..").boundingBox();

    expect(childBox).not.toBeNull();
    expect(parentBox).not.toBeNull();
    expect((childBox?.x ?? 0) + (childBox?.width ?? 0)).toBeLessThanOrEqual(
      (parentBox?.x ?? 0) + (parentBox?.width ?? 0) + 1
    );
  }
});

test("portfolio filters can be reset", async ({ page }) => {
  await page.goto("/portfolio?service=brand-identity");
  await expect(page.getByRole("link", { name: "Сбросить фильтры" })).toBeVisible();

  await page.getByRole("link", { name: "Сбросить фильтры" }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
});

test("project page has breadcrumbs and gallery slider", async ({ page }) => {
  await page.goto("/portfolio/studio-frame");

  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "Портфолио"
  );
  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "Услуги"
  );
  await expect(page.getByRole("region", { name: "Галерея проекта" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Следующее изображение" })).toBeVisible();

  await page.getByRole("button", { name: "Следующее изображение" }).click();
  await expect(page.getByText("2 / 2")).toBeVisible();
});

test("footer links to privacy policy and keeps admin as service entry", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Политика обработки персональных данных" }).click();

  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { name: "Политика обработки персональных данных" })).toBeVisible();
  await expect(page.getByText("Служебный вход")).toBeVisible();
});

test("preview admin can browse read-only admin sections", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Войти в demo admin" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Режим просмотра админки")).toBeVisible();
  await expect(page.getByText("admin-preview@local.test")).toBeVisible();

  const sections = [
    { label: "Проекты", path: /\/admin\/projects$/, heading: "Проекты" },
    { label: "Услуги", path: /\/admin\/services$/, heading: "Услуги" },
    { label: "Теги", path: /\/admin\/tags$/, heading: "Теги" },
    { label: "Изображения", path: /\/admin\/images$/, heading: "Изображения" },
    { label: "Заявки", path: /\/admin\/requests$/, heading: "Заявки" },
    { label: "Страницы", path: /\/admin\/pages$/, heading: "Страницы" }
  ];

  for (const section of sections) {
    await page.getByRole("link", { name: section.label }).first().click();
    await expect(page).toHaveURL(section.path);
    await expect(page.getByRole("heading", { name: section.heading })).toBeVisible();
    await expect(page.getByText("Режим просмотра админки")).toBeVisible();
  }

  await page.goto("/admin/projects");
  await expect(page.getByRole("button", { name: "Создать проект" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Удалить" }).first()).toBeDisabled();

  await page.goto("/admin/images");
  await expect(page.getByRole("button", { name: "Загрузить" })).toBeDisabled();

  await page.goto("/admin/requests");
  await expect(page.getByRole("button", { name: "Изменить статус" }).first()).toBeDisabled();
});
