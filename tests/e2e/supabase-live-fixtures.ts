import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";

import type { Database, UserRole } from "@/lib/supabase/database.types";
import { noopRealtimeTransport } from "../supabase-test-transport";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
export const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const shouldRunSupabaseSmoke =
  process.env.PLAYWRIGHT_SUPABASE_E2E === "1" && Boolean(supabaseUrl && publicKey && secretKey);

export type AppClient = SupabaseClient<Database>;

export type TestUser = {
  id: string;
  email: string;
  password: string;
  role: UserRole;
};

export function createAdminClient(): AppClient {
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

export async function createTestUser(
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

export async function cleanupOrderAttachmentsForRequests(
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

export async function deleteTestUsers(adminClient: AppClient, users: TestUser[]): Promise<void> {
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await adminClient.from("profiles").delete().in("id", userIds);
  }

  for (const user of users) {
    await adminClient.auth.admin.deleteUser(user.id);
  }
}

export async function resetBrowserSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function loginAsClient(page: Page, user: TestUser, claimToken = ""): Promise<void> {
  await resetBrowserSession(page);
  await page.goto(claimToken ? `/account/login?claim=${claimToken}` : "/account/login");
  const authForm = page.locator('form:has(input[name="email"])');

  await authForm.locator('input[name="email"]').fill(user.email);
  await authForm.locator('input[name="password"]').fill(user.password);
  await authForm.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/account(?:\/requests\/[^?]+)?(?:\?|$)/, { timeout: 15_000 });
}
