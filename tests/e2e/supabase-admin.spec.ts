import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import { createClaimTokenExpiresAt, hashClaimToken } from "@/lib/request-claim";
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

type AnalyticsEventInsert = Database["public"]["Tables"]["analytics_events"]["Insert"];

type PageSnapshot = {
  title: string;
  body: string;
  blocks: Json;
};

type AnalyticsSeedCounts = {
  ctaClicks: number;
  pageViews: number;
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

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);

  return copy;
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);

  return copy;
}

function isInsideAnalyticsSmokePeriod(createdAt: string | null, periodStart: Date | null, now: Date): boolean {
  if (!createdAt) {
    return false;
  }

  const eventDate = new Date(createdAt);

  return (!periodStart || eventDate >= periodStart) && eventDate <= now;
}

async function getAnalyticsSeedCounts(adminClient: AppClient): Promise<AnalyticsSeedCounts> {
  const { data, error } = await adminClient
    .from("analytics_events")
    .select("event_type, path, href, label, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(`Failed to inspect analytics events: ${error.message}`);
  }

  const now = new Date();
  const periodStarts = [
    addUtcDays(startOfUtcDay(now), -6),
    addUtcDays(startOfUtcDay(now), -29),
    null
  ];
  let maxPageViews = 0;
  let maxCtaClicks = 0;

  for (const periodStart of periodStarts) {
    const pageCounts = new Map<string, number>();
    const ctaCounts = new Map<string, number>();

    for (const event of data ?? []) {
      if (!isInsideAnalyticsSmokePeriod(event.created_at, periodStart, now)) {
        continue;
      }

      if (event.event_type === "page_view") {
        pageCounts.set(event.path, (pageCounts.get(event.path) ?? 0) + 1);
      }

      if (event.event_type === "cta_click") {
        const href = event.href || event.path;
        const label = event.label || href;
        const key = `${href}\n${label}`;
        ctaCounts.set(key, (ctaCounts.get(key) ?? 0) + 1);
      }
    }

    maxPageViews = Math.max(maxPageViews, ...pageCounts.values());
    maxCtaClicks = Math.max(maxCtaClicks, ...ctaCounts.values());
  }

  return {
    ctaClicks: Math.max(2, maxCtaClicks + 1),
    pageViews: Math.max(3, maxPageViews + 1)
  };
}

async function setupSmokeFixture(): Promise<SmokeFixture> {
  const adminClient = createAdminClient();
  const prefix = `pw-smoke-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const analyticsSeedCounts = await getAnalyticsSeedCounts(adminClient);
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

  const analyticsRows: AnalyticsEventInsert[] = [
    ...Array.from({ length: analyticsSeedCounts.pageViews }, (_, index) => ({
      event_type: "page_view" as const,
      path: `/qa-${prefix}`,
      search: "",
      referrer: "",
      href: "",
      label: "",
      source_hash: `${prefix}-visitor-${index}`,
      metadata: { fixture: prefix }
    })),
    ...Array.from({ length: analyticsSeedCounts.ctaClicks }, (_, index) => ({
      event_type: "cta_click" as const,
      path: `/qa-${prefix}`,
      search: "",
      referrer: "",
      href: `/order?qa=${prefix}`,
      label: `QA order ${prefix}`,
      source_hash: `${prefix}-visitor-${index}`,
      metadata: { fixture: prefix }
    }))
  ];

  const { data: analyticsEvents, error: analyticsError } = await adminClient
    .from("analytics_events")
    .insert(analyticsRows)
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
  const { data: smokeRequests } = await adminClient
    .from("requests")
    .select("id")
    .like("source_hash", `${prefix}-%`);
  const requestIds = Array.from(
    new Set([requestId, ...(smokeRequests?.map((request) => request.id) ?? [])].filter(Boolean))
  ) as string[];

  await cleanupOrderAttachmentsForRequests(adminClient, requestIds);

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

async function cleanupOrderAttachmentsForRequests(
  adminClient: AppClient,
  requestIds: string[]
): Promise<void> {
  if (!requestIds.length) {
    return;
  }

  const { data: attachments } = await adminClient
    .from("order_attachments")
    .select("id, storage_path")
    .in("request_id", requestIds);
  const attachmentIds = attachments?.map((attachment) => attachment.id) ?? [];
  const storagePaths = attachments?.map((attachment) => attachment.storage_path).filter(Boolean) ?? [];

  if (storagePaths.length > 0) {
    await adminClient.storage.from("order-attachments").remove(storagePaths);
  }

  if (attachmentIds.length > 0) {
    await adminClient.from("order_attachments").delete().in("id", attachmentIds);
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

async function loginAsClient(page: Page, user: TestUser, claimToken = ""): Promise<void> {
  await resetBrowserSession(page);
  await page.goto(claimToken ? `/account/login?claim=${claimToken}` : "/account/login");
  const authForm = page.locator('form:has(input[name="email"])');

  await authForm.locator('input[name="email"]').fill(user.email);
  await authForm.locator('input[name="password"]').fill(user.password);
  await authForm.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/account(?:\/requests\/[^?]+)?(?:\?|$)/, { timeout: 15_000 });
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

  test("admin users list keeps row actions inside the desktop viewport", async ({ page }) => {
    expect(fixture).not.toBeNull();

    await loginAs(page, fixture!.users.admin);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Пользователи и роли" })).toBeVisible();

    const clippedInteractive = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a, button"))
        .filter((element) => {
          const label = (element.textContent || element.getAttribute("aria-label") || "").trim();

          if (!/Открыть|Сохранить роль/.test(label)) {
            return false;
          }

          const rect = element.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
        })
        .map((element) => (element.textContent || element.getAttribute("aria-label") || "").trim())
    );

    expect(clippedInteractive).toEqual([]);
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

  test("analytics endpoint persists browser keepalive events in the database", async ({ page }) => {
    expect(fixture).not.toBeNull();

    const adminClient = fixture!.adminClient;
    const marker = `${fixture!.prefix}-endpoint`;
    const search = `?analytics-db-smoke=${marker}`;
    const createdEventIds: string[] = [];

    try {
      await page.goto("/");

      const statuses = await page.evaluate(
        async ({ marker, search }) => {
          const payloads = [
            {
              eventType: "page_view",
              path: "/portfolio",
              search,
              referrer: "",
              metadata: {
                fixture: marker,
                smoke: "analytics-db"
              }
            },
            {
              eventType: "cta_click",
              path: "/portfolio",
              search,
              referrer: "",
              href: `/order${search}`,
              label: `Analytics DB smoke ${marker}`,
              metadata: {
                fixture: marker,
                smoke: "analytics-db"
              }
            }
          ];

          return Promise.all(
            payloads.map(async (payload) => {
              const response = await window.fetch("/api/analytics", {
                body: JSON.stringify(payload),
                headers: {
                  "content-type": "application/json"
                },
                keepalive: true,
                method: "POST"
              });

              return response.status;
            })
          );
        },
        { marker, search }
      );

      expect(statuses).toEqual([204, 204]);

      await expect
        .poll(
          async () => {
            const { data, error } = await adminClient
              .from("analytics_events")
              .select("id")
              .eq("path", "/portfolio")
              .eq("search", search);

            if (error) {
              throw new Error(`Failed to read analytics smoke rows: ${error.message}`);
            }

            return data?.length ?? 0;
          },
          { timeout: 10_000 }
        )
        .toBe(2);

      const { data: events, error } = await adminClient
        .from("analytics_events")
        .select("id, event_type, path, search, href, label, metadata, source_hash")
        .eq("path", "/portfolio")
        .eq("search", search);

      expect(error).toBeNull();
      expect(events).toHaveLength(2);

      createdEventIds.push(...(events?.map((event) => event.id) ?? []));
      fixture!.analyticsEventIds.push(...createdEventIds);

      const eventTypes = events?.map((event) => event.event_type).sort();
      const pageView = events?.find((event) => event.event_type === "page_view");
      const ctaClick = events?.find((event) => event.event_type === "cta_click");

      expect(eventTypes).toEqual(["cta_click", "page_view"]);
      expect(pageView?.href).toBe("");
      expect(pageView?.label).toBe("");
      expect(ctaClick?.href).toBe(`/order${search}`);
      expect(ctaClick?.label).toBe(`Analytics DB smoke ${marker}`);
      expect(pageView?.metadata).toMatchObject({ fixture: marker, smoke: "analytics-db" });
      expect(ctaClick?.metadata).toMatchObject({ fixture: marker, smoke: "analytics-db" });
      expect(new Set(events?.map((event) => event.source_hash).filter(Boolean)).size).toBe(1);
      expect(JSON.stringify(events)).not.toContain("Playwright");
    } finally {
      if (createdEventIds.length > 0) {
        await adminClient.from("analytics_events").delete().in("id", createdEventIds);
      }

      await adminClient
        .from("analytics_events")
        .delete()
        .eq("path", "/portfolio")
        .eq("search", search);
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

  test("admin saves package and add-on order after reload", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const adminClient = fixture!.adminClient;
    const { data: existingService, error: serviceError } = await adminClient
      .from("services")
      .select("id, title")
      .eq("slug", fixture!.serviceSlug)
      .maybeSingle();

    if (serviceError) {
      throw new Error(`Failed to load smoke service: ${serviceError.message}`);
    }
    const createdService = !existingService;
    const service = existingService ?? (
      await adminClient
        .from("services")
        .insert({
          slug: fixture!.serviceSlug,
          title: `Smoke service ${fixture!.prefix}`,
          description: "Temporary service for order sorting smoke.",
          display_order: 999,
          is_active: true
        })
        .select("id, title")
        .single()
    ).data;

    if (!service) {
      throw new Error("Failed to create smoke service for order sorting");
    }

    const packageTitles = [`Package A ${fixture!.prefix}`, `Package B ${fixture!.prefix}`];
    const addonTitles = [`Addon A ${fixture!.prefix}`, `Addon B ${fixture!.prefix}`];

    try {
      const { error: packageError } = await adminClient.from("service_packages").insert(
        packageTitles.map((title, index) => ({
          service_id: service.id,
          title,
          price_from: 10000,
          price_to: 20000,
          duration_from_days: 5,
          duration_to_days: 10,
          display_order: (index + 1) * 10,
          is_active: true
        }))
      );
      const { error: addonError } = await adminClient.from("service_addons").insert(
        addonTitles.map((title, index) => ({
          service_id: service.id,
          title,
          price: 5000,
          duration_days: 1,
          display_order: (index + 1) * 10,
          is_active: true
        }))
      );

      if (packageError || addonError) {
        throw new Error(`Failed to seed order items: ${packageError?.message ?? addonError?.message}`);
      }

      await loginAs(page, fixture!.users.admin);
      await page.goto("/admin/services");
      const serviceCard = page.getByRole("heading", { name: service.title }).locator("xpath=ancestor::section[1]");

      await serviceCard.getByRole("button", { name: `Опустить ${packageTitles[0]}` }).click();
      await serviceCard.getByRole("button", { name: "Сохранить порядок пакетов" }).click();
      await page.goto("/admin/services");

      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("service_packages")
            .select("title")
            .eq("service_id", service.id)
            .order("display_order");
          return data?.map((item) => item.title);
        })
        .toEqual([...packageTitles].reverse());

      const refreshedCard = page.getByRole("heading", { name: service.title }).locator("xpath=ancestor::section[1]");
      await refreshedCard.getByRole("button", { name: `Опустить ${addonTitles[0]}` }).click();
      await refreshedCard.getByRole("button", { name: "Сохранить порядок дополнительных услуг" }).click();
      await page.goto("/admin/services");

      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("service_addons")
            .select("title")
            .eq("service_id", service.id)
            .order("display_order");
          return data?.map((item) => item.title);
        })
        .toEqual([...addonTitles].reverse());
    } finally {
      await adminClient.from("service_packages").delete().eq("service_id", service.id);
      await adminClient.from("service_addons").delete().eq("service_id", service.id);
      if (createdService) {
        await adminClient.from("services").delete().eq("id", service.id);
      }
    }
  });

  test("guest claim token links a request to the signed-in client once", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const adminClient = fixture!.adminClient;
    const claimToken = `${fixture!.prefix}-${randomUUID()}`;
    let claimRequestId: string | null = null;

    try {
      const { data: request, error: requestError } = await adminClient
        .from("requests")
        .insert({
          client_name: `Claim ${fixture!.prefix}`,
          contact_method: "email",
          contact_value: `${fixture!.prefix}-claim@example.test`,
          client_user_id: null,
          service_id: null,
          service_title: "Claim smoke",
          comment: "Temporary guest request for claim smoke.",
          result_description: "Temporary brief for guest claim smoke.",
          source_hash: `${fixture!.prefix}-claim`,
          status: "new"
        })
        .select("id")
        .single();

      expect(requestError).toBeNull();
      expect(request?.id).toBeTruthy();
      claimRequestId = request?.id ?? null;

      if (!claimRequestId) {
        throw new Error("Failed to create claim smoke request.");
      }

      const { error: claimError } = await adminClient.from("request_claim_tokens").insert({
        expires_at: createClaimTokenExpiresAt(),
        request_id: claimRequestId,
        token_hash: hashClaimToken(claimToken)
      });

      expect(claimError).toBeNull();

      await loginAsClient(page, fixture!.users.client, claimToken);
      await expect(page).toHaveURL(new RegExp(`/account/requests/${claimRequestId}\\?notice=request-claimed`));

      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("requests")
            .select("client_user_id")
            .eq("id", claimRequestId ?? "")
            .single();

          return data?.client_user_id;
        })
        .toBe(fixture!.users.client.id);

      const { data: usedToken } = await adminClient
        .from("request_claim_tokens")
        .select("used_at")
        .eq("request_id", claimRequestId ?? "")
        .single();

      expect(usedToken?.used_at).toBeTruthy();

      await loginAsClient(page, fixture!.users.client, claimToken);
      await expect(page).toHaveURL(/\/account\?notice=signed-in/);
    } finally {
      if (claimRequestId) {
        await cleanupOrderAttachmentsForRequests(adminClient, [claimRequestId]);
        await adminClient.from("requests").delete().eq("id", claimRequestId);
      }

      await adminClient.from("requests").delete().like("source_hash", `${fixture!.prefix}-claim%`);
    }
  });

  test("client uploads private order material and manager sees it", async ({ page }) => {
    expect(fixture).not.toBeNull();
    expect(fixture!.requestId).toBeTruthy();
    const adminClient = fixture!.adminClient;
    const fileName = `brief-${fixture!.prefix}.txt`;
    const attachmentIds: string[] = [];
    const storagePaths: string[] = [];

    try {
      await loginAsClient(page, fixture!.users.client);
      await page.goto(`/account/requests/${fixture!.requestId}`);

      const attachmentForm = page.locator('form:has(input[name="attachments"])');
      await expect(attachmentForm).toBeVisible();
      await attachmentForm.locator('input[name="attachments"]').setInputFiles({
        name: fileName,
        mimeType: "text/plain",
        buffer: Buffer.from(`Temporary order material ${fixture!.prefix}`, "utf8")
      });
      await attachmentForm.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(new RegExp(`/account/requests/${fixture!.requestId}.*notice=attachment-uploaded`));
      await expect(page.getByRole("link", { name: fileName })).toBeVisible();

      await expect
        .poll(async () => {
          const { data } = await adminClient
            .from("order_attachments")
            .select("id, storage_path")
            .eq("request_id", fixture!.requestId ?? "")
            .eq("file_name", fileName);

          attachmentIds.splice(0, attachmentIds.length, ...(data?.map((attachment) => attachment.id) ?? []));
          storagePaths.splice(
            0,
            storagePaths.length,
            ...(data?.map((attachment) => attachment.storage_path).filter(Boolean) ?? [])
          );

          return data?.length ?? 0;
        })
        .toBe(1);

      await loginAs(page, fixture!.users.manager);
      await page.goto(`/admin/requests/${fixture!.requestId}`);
      await expect(page.getByRole("link", { name: fileName })).toBeVisible();
    } finally {
      if (storagePaths.length > 0) {
        await adminClient.storage.from("order-attachments").remove(storagePaths);
      }

      if (attachmentIds.length > 0) {
        await adminClient.from("order_attachments").delete().in("id", attachmentIds);
      }
    }
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
      await form.locator("xpath=ancestor::details[1]").locator("summary").click();
      await expect(form).toBeVisible();

      await form.getByRole("button", { name: "Добавить текстовый раздел" }).click();
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

  test("registration creates an Auth user and profile", async ({ page }) => {
    expect(fixture).not.toBeNull();
    const email = `${fixture!.prefix}-registration@example.test`;
    const password = `${randomUUID()}Aa1!`;
    let userId = "";

    try {
      await resetBrowserSession(page);
      await page.goto("/account/register");
      await page.locator('input[name="fullName"]').fill("Мария Тестовая");
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole("button", { name: "Создать кабинет" }).click();

      await expect
        .poll(async () => {
          const users = await fixture!.adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const user = users.data.users.find((item) => item.email === email);
          userId = user?.id ?? "";
          return Boolean(userId);
        })
        .toBe(true);

      await expect
        .poll(async () => {
          const { data } = await fixture!.adminClient
            .from("profiles")
            .select("full_name, role")
            .eq("id", userId)
            .maybeSingle();
          return data;
        })
        .toEqual({ full_name: "Мария Тестовая", role: "client" });
    } finally {
      if (userId) {
        await fixture!.adminClient.auth.admin.deleteUser(userId);
      }
    }
  });

  test("contract supports revision request, resend and acceptance", async ({ page }) => {
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

    await loginAsClient(page, fixture!.users.client);
    await page.goto(`/account/requests/${fixture!.requestId}`);
    await expect(page.getByRole("heading", { name: "Договор-заказ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "История" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Таймлайн" })).toHaveCount(0);
    await expect(page.getByText("На согласовании")).toBeVisible();

    await page.getByText("Запросить изменения").click();
    await page.locator('textarea[name="feedback"]').fill("Уточните, пожалуйста, состав финальных файлов и этапы передачи.");
    await page.getByRole("button", { name: "Отправить комментарий" }).click();
    await expect(page).toHaveURL(new RegExp(`notice=order-contract-revision-requested`));
    await expect(page.getByText("На доработке")).toBeVisible();

    await loginAs(page, fixture!.users.manager);
    await page.goto(`/admin/requests/${fixture!.requestId}`);
    await expect(page.getByText("Уточните, пожалуйста, состав финальных файлов и этапы передачи.")).toBeVisible();
    const revisedContractForm = page.locator('form:has(input[name="finalPrice"])');
    await revisedContractForm
      .locator('textarea[name="materials"]')
      .fill("Макет, исходные материалы, экспортированные файлы и инструкция по передаче.");
    await revisedContractForm.locator('select[name="status"]').selectOption("sent");
    await revisedContractForm.getByRole("button", { name: "Сохранить договор-заказ" }).click();

    await loginAsClient(page, fixture!.users.client);
    await page.goto(`/account/requests/${fixture!.requestId}`);
    await expect(page.getByText("На согласовании")).toBeVisible();
    await page.getByRole("button", { name: "Принять условия" }).click();
    await expect(page).toHaveURL(new RegExp(`/account/requests/${fixture!.requestId}\\?notice=order-contract-accepted`));
    await expect(page.getByText("Принят", { exact: true })).toBeVisible();

    await loginAs(page, fixture!.users.manager);
    await page.goto(`/admin/requests/${fixture!.requestId}`);
    await expect(page.getByText(/Редактирование недоступно. Клиент принял договор-заказ./)).toBeVisible();
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
