import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import type { Database, Json, UserRole } from "@/lib/supabase/database.types";
import { noopRealtimeTransport } from "../supabase-test-transport";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const shouldRunSupabaseSmoke =
  process.env.PLAYWRIGHT_SUPABASE_E2E === "1" && Boolean(supabaseUrl && publicKey && secretKey);

type AppClient = SupabaseClient<Database>;

type TestUser = {
  id: string;
  email: string;
  password: string;
  role: UserRole;
};

type SmokeFixture = {
  prefix: string;
  adminClient: AppClient;
  users: Record<"admin" | "manager" | "client", TestUser>;
  requestId: string | null;
  serviceSlug: string;
  analyticsEventIds: string[];
};

type PageSnapshot = {
  title: string;
  body: string;
  blocks: Json;
};

function createAdminClient(): AppClient {
  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: noopRealtimeTransport
    }
  });
}

async function createTestUser(
  adminClient: AppClient,
  prefix: string,
  role: UserRole
): Promise<TestUser> {
  const email = `${prefix}-${role}@example.test`;
  const password = `${randomUUID()}Aa1!`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `Supabase E2E ${role}`
    }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create ${role} test user: ${error?.message ?? "empty user"}`);
  }

  await adminClient.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: `Supabase E2E ${role}`,
    role
  });

  return {
    id: data.user.id,
    email,
    password,
    role
  };
}

async function setupSmokeFixture(): Promise<SmokeFixture> {
  const adminClient = createAdminClient();
  const prefix = `pw-smoke-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const [admin, manager, client] = await Promise.all([
    createTestUser(adminClient, prefix, "admin"),
    createTestUser(adminClient, prefix, "manager"),
    createTestUser(adminClient, prefix, "client")
  ]);
  const { data: request, error: requestError } = await adminClient
    .from("requests")
    .insert({
      client_name: `Export ${prefix}`,
      contact_method: "email",
      contact_value: `${prefix}@example.test`,
      client_user_id: client.id,
      service_id: null,
      service_title: "Supabase E2E",
      comment: "Temporary request for export smoke.",
      result_description: "Temporary order brief for contract smoke.",
      style_preferences: "Clean and restrained visual direction.",
      estimated_price_from: 30000,
      estimated_price_to: 50000,
      estimated_duration_from_days: 7,
      estimated_duration_to_days: 12,
      source_hash: `${prefix}-export`,
      status: "new"
    })
    .select("id")
    .single();

  if (requestError) {
    throw new Error(`Failed to create export request: ${requestError.message}`);
  }

  const { data: analyticsEvents, error: analyticsError } = await adminClient
    .from("analytics_events")
    .insert([
      {
        event_type: "page_view",
        path: `/qa-${prefix}`,
        search: "",
        referrer: "",
        href: "",
        label: "",
        source_hash: `${prefix}-visitor-a`,
        metadata: { fixture: prefix }
      },
      {
        event_type: "page_view",
        path: `/qa-${prefix}`,
        search: "",
        referrer: "",
        href: "",
        label: "",
        source_hash: `${prefix}-visitor-b`,
        metadata: { fixture: prefix }
      },
      {
        event_type: "cta_click",
        path: `/qa-${prefix}`,
        search: "",
        referrer: "",
        href: `/order?qa=${prefix}`,
        label: `QA order ${prefix}`,
        source_hash: `${prefix}-visitor-a`,
        metadata: { fixture: prefix }
      }
    ])
    .select("id");

  if (analyticsError) {
    throw new Error(`Failed to create analytics events: ${analyticsError.message}`);
  }

  return {
    prefix,
    adminClient,
    users: {
      admin,
      manager,
      client
    },
    requestId: request?.id ?? null,
    serviceSlug: `${prefix}-service`,
    analyticsEventIds: analyticsEvents?.map((event) => event.id) ?? []
  };
}

async function cleanupSmokeFixture(fixture: SmokeFixture | null): Promise<void> {
  if (!fixture) {
    return;
  }

  const { adminClient, prefix, users, requestId, serviceSlug } = fixture;

  if (requestId) {
    await adminClient.from("requests").delete().eq("id", requestId);
  }

  if (fixture.analyticsEventIds.length > 0) {
    await adminClient.from("analytics_events").delete().in("id", fixture.analyticsEventIds);
  }

  await adminClient.from("analytics_events").delete().like("source_hash", `${prefix}-%`);
  await adminClient.from("requests").delete().like("source_hash", `${prefix}-%`);
  await adminClient.from("services").delete().eq("slug", serviceSlug);

  const { data: smokeImages } = await adminClient
    .from("images")
    .select("id, storage_path")
    .like("title", "Smoke upload pw-smoke-%");
  const imageIds = smokeImages?.map((image) => image.id) ?? [];
  const storagePaths = smokeImages?.map((image) => image.storage_path).filter(Boolean) ?? [];

  if (imageIds.length > 0) {
    await adminClient.from("images").delete().in("id", imageIds);
  }

  if (storagePaths.length > 0) {
    await adminClient.storage.from("portfolio-images").remove(storagePaths);
  }

  await adminClient.from("profiles").delete().in(
    "id",
    Object.values(users).map((user) => user.id)
  );

  for (const user of Object.values(users)) {
    await adminClient.auth.admin.deleteUser(user.id);
  }
}

async function resetBrowserSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function loginAs(page: Page, user: TestUser): Promise<void> {
  await resetBrowserSession(page);
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 15_000 });
}

async function loginAsRejected(page: Page, user: TestUser): Promise<void> {
  await resetBrowserSession(page);
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15_000 });
  await expect(page.locator("body")).toContainText("нет доступа");
}

test.describe("real Supabase admin smoke", () => {
  test.skip(!shouldRunSupabaseSmoke, "Set PLAYWRIGHT_SUPABASE_E2E=1 and Supabase env keys.");
  test.describe.configure({ mode: "serial" });

  let fixture: SmokeFixture | null = null;

  test.beforeAll(async () => {
    fixture = await setupSmokeFixture();
  });

  test.afterAll(async () => {
    test.setTimeout(90_000);
    await cleanupSmokeFixture(fixture);
  });

  test("admin, manager and client roles get the expected admin access", async ({ page }) => {
    expect(fixture).not.toBeNull();

    await loginAs(page, fixture!.users.admin);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);

    await loginAs(page, fixture!.users.manager);
    await page.goto("/admin/requests");
    await expect(page).toHaveURL(/\/admin\/requests/);
    await page.goto("/admin/services");
    await expect(page).toHaveURL(/\/admin$/);

    await loginAsRejected(page, fixture!.users.client);
  });

  test("admin analytics shows seeded traffic events across periods", async ({ page }) => {
    expect(fixture).not.toBeNull();

    await loginAs(page, fixture!.users.admin);

    for (const target of ["/admin/analytics?period=7", "/admin/analytics", "/admin/analytics?period=all"]) {
      await page.goto(target);
      await expect(page).toHaveURL(/\/admin\/analytics/);
      await expect(page.getByText("Просмотры страниц")).toBeVisible();
      await expect(page.getByText("Клики по CTA")).toBeVisible();
      await expect(page.getByText(`/qa-${fixture!.prefix}`)).toBeVisible();
      await expect(page.getByText(`QA order ${fixture!.prefix}`)).toBeVisible();
    }
  });

  test("admin can create a service and manager can export requests", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const adminClient = fixture!.adminClient;
    const title = `Smoke service ${fixture!.prefix}`;

    await loginAs(page, fixture!.users.admin);
    await page.goto("/admin/services");
    const serviceForm = page.locator('form:has(input[name="title"])').first();

    await serviceForm.locator('input[name="title"]').fill(title);
    await serviceForm.locator('input[name="slug"]').fill(fixture!.serviceSlug);
    await serviceForm.locator('textarea[name="description"]').fill("Temporary service for e2e smoke.");
    await serviceForm.locator('textarea[name="details"]').fill("Created by Playwright and removed in cleanup.");
    await serviceForm.locator('button[type="submit"]').click();
    await expect
      .poll(async () => {
        const { data } = await adminClient
          .from("services")
          .select("id")
          .eq("slug", fixture!.serviceSlug);

        return data?.length ?? 0;
      })
      .toBe(1);
    await page.goto("/admin/services");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await loginAs(page, fixture!.users.manager);
    const exportResponse = await page.request.get(
      `/admin/requests/export?query=${encodeURIComponent(fixture!.prefix)}`
    );

    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  test("admin page block QA restores the original page snapshot", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const adminClient = fixture!.adminClient;
    const pageKey = "services";
    const qaKey = `qa-${fixture!.prefix}`;
    const qaValue = `Temporary QA block ${fixture!.prefix}`;
    let snapshot: PageSnapshot | null = null;

    const { data: pageSnapshot, error: snapshotError } = await adminClient
      .from("pages")
      .select("title, body, blocks")
      .eq("page_key", pageKey)
      .single();

    if (snapshotError || !pageSnapshot) {
      throw new Error(`Failed to snapshot page ${pageKey}: ${snapshotError?.message ?? "empty page"}`);
    }

    snapshot = {
      title: pageSnapshot.title,
      body: pageSnapshot.body,
      blocks: pageSnapshot.blocks
    };

    try {
      await loginAs(page, fixture!.users.admin);
      await page.goto("/admin/pages");

      const form = page.locator(`form:has(input[name="pageKey"][value="${pageKey}"])`);
      await expect(form).toBeVisible();

      await form.locator('button[type="button"]').last().click();
      await form.locator('input[placeholder="Название блока"]').last().fill(qaKey);
      await form.locator('textarea[placeholder="Текст блока"]').last().fill(qaValue);
      await form.locator('button[type="submit"]').click();

      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("pages")
            .select("blocks")
            .eq("page_key", pageKey)
            .single();
          const blocks = data?.blocks;

          return blocks && typeof blocks === "object" && !Array.isArray(blocks)
            ? (blocks as Record<string, unknown>)[qaKey]
            : null;
        })
        .toBe(qaValue);

      await page.reload();
      await expect(form.locator('input[placeholder="Название блока"]').last()).toHaveValue(qaKey);
      await expect(form.locator('textarea[placeholder="Текст блока"]').last()).toHaveValue(qaValue);
    } finally {
      if (snapshot) {
        await adminClient
          .from("pages")
          .update({
            title: snapshot.title,
            body: snapshot.body,
            blocks: snapshot.blocks
          })
          .eq("page_key", pageKey);
      }
    }

    const { data: restored } = await adminClient
      .from("pages")
      .select("blocks")
      .eq("page_key", pageKey)
      .single();
    const restoredBlocks = restored?.blocks;

    expect(
      restoredBlocks && typeof restoredBlocks === "object" && !Array.isArray(restoredBlocks)
        ? (restoredBlocks as Record<string, unknown>)[qaKey]
        : undefined
    ).toBeUndefined();
  });

  test("admin user role QA restores the target user role", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const adminClient = fixture!.adminClient;
    const targetUser = fixture!.users.client;

    try {
      await loginAs(page, fixture!.users.admin);
      await page.goto(`/admin/users/${targetUser.id}`);

      const roleSelect = page.locator('select[name="role"]').first();
      await expect(roleSelect).toHaveValue("client");

      await roleSelect.selectOption("manager");
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/notice=user-role-updated/);
      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("profiles")
            .select("role")
            .eq("id", targetUser.id)
            .single();

          return data?.role;
        })
        .toBe("manager");

      await page.goto(`/admin/users/${targetUser.id}`);
      await page.locator('select[name="role"]').first().selectOption("client");
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/notice=user-role-updated/);
      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("profiles")
            .select("role")
            .eq("id", targetUser.id)
            .single();

          return data?.role;
        })
        .toBe("client");
    } finally {
      await adminClient.from("profiles").update({ role: "client" }).eq("id", targetUser.id);
    }
  });

  test("manager can send a contract-order and client can accept it", async ({ page }) => {
    expect(fixture).not.toBeNull();
    expect(fixture!.requestId).toBeTruthy();

    await loginAs(page, fixture!.users.manager);
    await page.goto(`/admin/requests/${fixture!.requestId}`);
    await expect(page.getByRole("heading", { name: "Договор-заказ" })).toBeVisible();
    const contractForm = page.locator('form:has(input[name="finalPrice"])');

    await contractForm.locator('input[name="finalPrice"]').fill("42000");
    await contractForm.locator('input[name="finalDurationDays"]').fill("10");
    await contractForm
      .locator('textarea[name="workScope"]')
      .fill("Подготовка дизайн-макета, визуального направления и финальных файлов.");
    await contractForm
      .locator('textarea[name="materials"]')
      .fill("Макет, исходные материалы и подготовленные файлы результата.");
    await contractForm.locator('textarea[name="managerComment"]').fill("Срок и стоимость согласованы.");
    await contractForm.locator('select[name="status"]').selectOption("sent");
    await contractForm.getByRole("button", { name: "Сохранить договор-заказ" }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/requests/${fixture!.requestId}`));
    await expect(page.getByText("Договор: Отправлен клиенту")).toBeVisible();

    await resetBrowserSession(page);
    await page.goto("/account/login");
    await page.locator('input[name="email"]').fill(fixture!.users.client.email);
    await page.locator('input[name="password"]').fill(fixture!.users.client.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/account(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Мои заказы" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Договор-заказ" })).toBeVisible();
    await expect(page.getByText("На согласовании")).toBeVisible();

    await page.getByRole("button", { name: "Принять договор-заказ" }).click();
    await expect(page).toHaveURL(/\/account\?notice=order-contract-accepted/);
    await expect(page.getByText("Принят", { exact: true })).toBeVisible();
  });

  test("admin can upload and remove a small portfolio image", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const adminClient = fixture!.adminClient;
    const title = `Smoke upload ${fixture!.prefix}`;
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l7z1nAAAAABJRU5ErkJggg==",
      "base64"
    );
    const uploadedStoragePaths: string[] = [];

    try {
      await loginAs(page, fixture!.users.admin);
      await page.goto("/admin/images");
      await page.locator('input[name="file"]').setInputFiles({
        name: "smoke.png",
        mimeType: "image/png",
        buffer: png
      });
      await page.locator('input[name="title"]').fill(title);
      await page.locator('button[type="submit"]').click();

      await expect(page.getByRole("heading", { name: title })).toBeVisible();

      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("images")
            .select("id, storage_path")
            .eq("title", title);

          uploadedStoragePaths.splice(
            0,
            uploadedStoragePaths.length,
            ...(data?.map((image) => image.storage_path).filter(Boolean) ?? [])
          );

          return data?.length ?? 0;
        })
        .toBeGreaterThan(0);

      const uploadedCard = page
        .getByRole("heading", { name: title })
        .locator("xpath=ancestor::section[1]");
      await uploadedCard.getByRole("button", { name: "Удалить" }).click();
      await expect
        .poll(async () => {
          const { data } = await adminClient.from("images").select("id").eq("title", title);

          return data?.length ?? 0;
        })
        .toBe(0);

      await page.goto("/admin/images");
      await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
    } finally {
      const { data: remainingImages } = await adminClient
        .from("images")
        .select("id, storage_path")
        .eq("title", title);
      const remainingImageIds = remainingImages?.map((image) => image.id) ?? [];
      const remainingStoragePaths = [
        ...uploadedStoragePaths,
        ...(remainingImages?.map((image) => image.storage_path).filter(Boolean) ?? [])
      ];

      if (remainingImageIds.length > 0) {
        await adminClient.from("images").delete().in("id", remainingImageIds);
      }

      if (remainingStoragePaths.length > 0) {
        await adminClient.storage.from("portfolio-images").remove(remainingStoragePaths);
      }
    }
  });
});
