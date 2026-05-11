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

test("admin login renders setup notice or Supabase form", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Вход в админку" })).toBeVisible();

  const setupNotice = page.getByText("Для входа настройте Supabase");

  if (await setupNotice.isVisible()) {
    await expect(setupNotice).toBeVisible();
  } else {
    await expect(page.getByLabel("Email администратора")).toBeVisible();
    await expect(page.getByLabel("Пароль")).toBeVisible();
  }
});

test("services page keeps service ctas compact", async ({ page }) => {
  await page.goto("/services");
  const serviceCta = page.getByRole("link", { name: "Пример работ" }).first();
  const orderCta = page.getByRole("link", { name: "Заказать" }).first();

  await expect(serviceCta).toBeVisible();
  await expect(orderCta).toBeVisible();

  const box = await serviceCta.boundingBox();
  expect(box?.height).toBeLessThan(70);
  expect(box?.width).toBeGreaterThan(80);

  await orderCta.click();
  await expect(page).toHaveURL(/\/order\?service=/);
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

test("mobile public navigation opens without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByText("Навигация")).toBeVisible();
  await page.getByText("Навигация").click();
  await expect(page.locator("header").getByRole("link", { name: "Услуги" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});

test("portfolio filters can be reset", async ({ page }) => {
  await page.goto("/portfolio?service=brand-identity");
  await expect(page.getByRole("link", { name: "Сбросить фильтры" })).toBeVisible();

  await page.getByRole("link", { name: "Сбросить фильтры" }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
});

test("portfolio supports multi-select filters and sorting", async ({ page }) => {
  await page.goto("/portfolio?service=brand-identity&service=presentation-design&tag=digital&sort=oldest");

  await expect(page.getByText("Выбрано")).toBeVisible();
  await expect(page.getByLabel("Сортировка")).toHaveValue("oldest");
  await expect(page).toHaveURL(/service=brand-identity/);
  await expect(page).toHaveURL(/service=presentation-design/);
  await expect(page).toHaveURL(/tag=digital/);
});

test("mobile portfolio keeps filters and cards inside viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/portfolio");

  await expect(page.getByRole("heading", { name: "Портфолио" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Все услуги" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});

test("project page has breadcrumbs and gallery slider", async ({ page }) => {
  await page.goto("/portfolio/studio-frame");

  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "Портфолио"
  );
  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "Услуги"
  );
  await expect(
    page
      .getByRole("region", { name: "Галерея проекта" })
      .or(page.getByText("Изображения для галереи пока не добавлены."))
  ).toBeVisible();

  const nextButton = page.getByRole("button", { name: "Следующее изображение" });

  if (await nextButton.isVisible()) {
    await nextButton.click();
    await expect(page.getByText("2 / 2")).toBeVisible();
  } else {
    await expect(
      page.getByText("1 / 1").or(page.getByText("Изображения для галереи пока не добавлены."))
    ).toBeVisible();
  }
});

test("order form blocks empty submissions with browser field validation", async ({ page }) => {
  await page.goto("/order");

  await page.getByRole("button", { name: "Отправить заявку" }).click();
  const clientNameState = await page.locator('input[name="clientName"]').evaluate((element) => {
    const input = element as HTMLInputElement;

    return {
      maxLength: input.maxLength,
      minLength: input.minLength,
      required: input.required,
      valueMissing: input.validity.valueMissing
    };
  });

  expect(clientNameState).toEqual({
    maxLength: 120,
    minLength: 2,
    required: true,
    valueMissing: true
  });
  await expect(page.getByText("0 / 120, минимум 2")).toBeVisible();
  await expect(page.getByText("Заполните обязательные поля")).toHaveCount(0);
});

test("public routes send baseline security headers", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("footer links to privacy policy and hides admin entry", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Политика обработки персональных данных" }).click();

  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { name: "Политика обработки персональных данных" })).toBeVisible();
  await expect(page.getByText("Служебный вход")).toHaveCount(0);
});

test("preview admin can browse read-only admin sections", async ({ page }) => {
  await page.goto("/admin/login");
  const demoLoginButton = page.getByRole("button", { name: "Войти в demo admin" });

  test.skip(
    !(await demoLoginButton.isVisible()),
    "Preview demo login is hidden on the currently reused Supabase dev server."
  );

  await demoLoginButton.click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Режим просмотра админки")).toBeVisible();
  await expect(page.getByRole("complementary").getByText("admin-preview@local.test")).toBeVisible();

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
  await expect(page.locator('select[name="status"]').first()).toBeDisabled();
});

test("mobile preview admin uses compact section navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/login");
  const demoLoginButton = page.getByRole("button", { name: "Войти в demo admin" });

  test.skip(
    !(await demoLoginButton.isVisible()),
    "Preview demo login is hidden on the currently reused Supabase dev server."
  );

  await demoLoginButton.click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Разделы")).toBeVisible();
  await page.getByText("Разделы").click();
  await page.getByRole("link", { name: "Проекты", exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});
