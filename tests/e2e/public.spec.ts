import { expect, test, type Page } from "@playwright/test";

async function goToNextOrderStep(page: Page) {
  await page.getByRole("button", { name: "Далее" }).click();
}

async function reachOrderReview(page: Page, options: { email?: string; name?: string } = {}) {
  const email = options.email ?? `qa-wizard-${Date.now()}@example.test`;

  await page.goto("/order?service=brand-identity");
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await page.locator('textarea[name="resultDescription"]').fill("QA wizard order brief for a visual identity.");
  await page.locator('textarea[name="stylePreferences"]').fill("Clean, premium, restrained.");
  await goToNextOrderStep(page);
  await page.locator('input[name="clientName"]').fill(options.name ?? "QA Wizard");
  await page.locator('select[name="contactMethod"]').selectOption("Email");
  await page.locator('input[name="contactValue"]').fill(email);
  await goToNextOrderStep(page);
  await expect(page.getByRole("heading", { name: "Проверка" })).toBeVisible();
}

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
  await expect(page.getByText("Шаг 1 из 6").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сводка заказа" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Далее" })).toBeVisible();
});

test("admin login renders setup notice or authentication form", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Вход в административную панель" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти в demo admin" })).toHaveCount(0);

  const setupNotice = page.getByText("Вход временно недоступен");

  if (await setupNotice.isVisible()) {
    await expect(setupNotice).toBeVisible();
  } else {
    await expect(page.getByLabel("Email администратора")).toBeVisible();
    await expect(page.getByLabel("Пароль")).toBeVisible();
  }
});

test("protected admin routes require Supabase authentication", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Вход в административную панель" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти в demo admin" })).toHaveCount(0);
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
  const telegram = page.getByText("@portfolio_contact");

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

test("tablet public header stays inside viewport", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Графический дизайн, который помогает брендам говорить точнее" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Оставить заявку" })).toBeVisible();

  const layout = await page.evaluate(() => {
    const clippedInteractive = Array.from(document.querySelectorAll("a, button"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();

        return rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .map((element) => (element.textContent || element.getAttribute("aria-label") || "").trim());

    return {
      clippedInteractive,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });

  expect(layout.hasHorizontalOverflow).toBe(false);
  expect(layout.clippedInteractive).toEqual([]);
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

test("order wizard blocks advancing from an incomplete brief", async ({ page }) => {
  await page.goto("/order");

  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await expect(page.getByRole("heading", { name: "Бриф" })).toBeVisible();
  await goToNextOrderStep(page);

  await expect(page.getByText("Опишите ожидаемый результат чуть подробнее.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Бриф" })).toBeVisible();
});

test("order form briefly delays submit availability", async ({ page }) => {
  await reachOrderReview(page);

  const submitButton = page.getByRole("button", { name: "Отправить заказ" });

  await expect(submitButton).toBeEnabled({ timeout: 4_000 });
});

test("order form recalculates package and add-ons", async ({ page }) => {
  await page.goto("/order?service=brand-identity");
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);

  await expect(page.getByRole("heading", { name: "Сводка заказа" })).toBeVisible();
  await expect(page.getByText(/Стоимость/)).toBeVisible();

  const addon = page.locator('input[name="addonIds"]').first();

  if (await addon.count()) {
    const before = await page.getByRole("heading", { name: "Сводка заказа" }).locator("..").innerText();

    await addon.check();
    await expect(page.getByRole("heading", { name: "Доплаты", exact: true })).toBeVisible();
    const after = await page.getByRole("heading", { name: "Сводка заказа" }).locator("..").innerText();

    expect(after).not.toBe(before);
  }
});

test("order package cards show marketing fields and recommended state", async ({ page }) => {
  await page.goto("/order?service=brand-identity");
  await goToNextOrderStep(page);

  await expect(page.getByRole("heading", { name: "Пакет" })).toBeVisible();
  await expect(page.getByText("Оптимальный выбор").first()).toBeVisible();
  await expect(page.getByText("Популярный").first()).toBeVisible();
  await expect(page.getByText("Для запуска или обновления малого бренда")).toBeVisible();
  await expect(page.getByText("Логотип").first()).toBeVisible();
});

test("mobile order form keeps visual examples inside viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/order?service=brand-identity");
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);

  await expect(page.getByRole("heading", { name: "Оформить заказ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Пример работы для ориентира" })).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});

test("order form preserves contact fields after fast-submit guard", async ({ page }) => {
  const email = `qa-fast-${Date.now()}@example.test`;
  await reachOrderReview(page, { email, name: "QA Fast Submit" });
  const form = page.locator('main form:has(input[name="clientName"])');

  const submitButton = form.getByRole("button", { name: "Отправить заказ" });

  await expect(submitButton).toBeEnabled({ timeout: 4_000 });
  await form.locator('input[name="formStartedAt"]').evaluate((element) => {
    (element as HTMLInputElement).value = String(Date.now());
  });
  await submitButton.click();

  await expect(page.getByText("Форма отправлена слишком быстро. Проверьте данные и попробуйте ещё раз.")).toBeVisible();
  await expect(form.locator('select[name="contactMethod"]')).toHaveValue("Email");
  await expect(form.locator('input[name="contactValue"]')).toHaveValue(email);
});

test("order brief chips preserve manual text and avoid duplicates", async ({ page }) => {
  await page.goto("/order?service=brand-identity");
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);

  const brief = page.locator('textarea[name="resultDescription"]');
  await brief.fill("Нужен фирменный стиль");
  await page.getByRole("button", { name: "логотип", exact: true }).click();
  await page.getByRole("button", { name: "логотип", exact: true }).click();

  await expect(brief).toHaveValue("Нужен фирменный стиль, логотип");
});

test("order draft restores wizard fields after reload", async ({ page }) => {
  await page.goto("/order?service=brand-identity");
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await goToNextOrderStep(page);
  await page.locator('textarea[name="resultDescription"]').fill("Черновик заявки для проверки восстановления.");

  await page.reload();

  await expect(page.getByRole("heading", { name: "Бриф" })).toBeVisible();
  await expect(page.locator('textarea[name="resultDescription"]')).toHaveValue(
    "Черновик заявки для проверки восстановления."
  );
  await page.getByRole("button", { name: "Очистить черновик" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Услуга" })).toBeVisible();
});

test("order quiz recommends an existing service", async ({ page }) => {
  await page.goto("/order");

  await page.getByRole("button", { name: "Помочь выбрать" }).click();
  await page.getByRole("button", { name: "Презентация" }).click();
  await page.getByRole("button", { name: "Продажи" }).click();
  await page.getByRole("button", { name: "Обычный срок" }).click();
  await page.getByRole("button", { name: "Всё готово" }).click();
  await page.getByRole("button", { name: "Одна задача" }).click();
  await page.getByRole("button", { name: "Подобрать услугу" }).click();

  await expect(page.locator('select[name="serviceId"]')).toHaveValue(/.+/);
  await goToNextOrderStep(page);
  await expect(page.getByRole("heading", { name: "Пакет" })).toBeVisible();
});

test("public routes send baseline security headers", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["content-security-policy"]).toContain("object-src 'none'");
  expect(response?.headers()["strict-transport-security"]).toBeUndefined();
});

test("footer links to privacy policy and hides admin entry", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Политика обработки персональных данных" }).click();

  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByRole("heading", { name: "Политика обработки персональных данных" })).toBeVisible();
  await expect(page.getByText("Служебный вход")).toHaveCount(0);
});

test("mobile admin login keeps authentication form inside viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/login");

  await expect(page.getByRole("heading", { name: "Вход в административную панель" })).toBeVisible();
  await expect(page.getByLabel("Email администратора")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти в demo admin" })).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});

test("publicly visible UI avoids technical and informal copy", async ({ page }) => {
  for (const route of ["/admin/login", "/order"]) {
    await page.goto(route);
    const visibleText = await page.locator("body").innerText();

    expect(visibleText).not.toContain("Supabase");
    expect(visibleText).not.toContain("bucket");
    expect(visibleText).not.toContain("Админка");
    expect(visibleText).not.toContain("админка");
    expect(visibleText).not.toContain("ПА");
  }
});
