import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  cleanupOrderAttachmentsForRequests,
  createAdminClient,
  createTestUser,
  deleteTestUsers,
  loginAsClient,
  shouldRunSupabaseSmoke,
  type TestUser
} from "./supabase-live-fixtures";

test.describe("real Supabase account detail accessibility", () => {
  test.skip(!shouldRunSupabaseSmoke, "Set PLAYWRIGHT_SUPABASE_E2E=1 and Supabase env keys.");

  test("authenticated request detail has no serious axe violations", async ({ page }) => {
    const adminClient = createAdminClient();
    const prefix = `pw-smoke-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const users: TestUser[] = [];
    let requestId = "";

    try {
      const clientUser = await createTestUser(adminClient, prefix, "client");
      users.push(clientUser);

      const { data: request, error: requestError } = await adminClient
        .from("requests")
        .insert({
          client_name: `Account a11y ${prefix}`,
          contact_method: "email",
          contact_value: `${prefix}@example.test`,
          client_user_id: clientUser.id,
          service_id: null,
          service_title: "Account accessibility",
          package_title: "Detail smoke",
          package_description: "Temporary package for accessibility smoke.",
          result_description: "Temporary order brief for account detail accessibility smoke.",
          style_preferences: "Clean and restrained visual direction.",
          materials: "Temporary source materials.",
          estimated_price_from: 30000,
          estimated_price_to: 50000,
          estimated_duration_from_days: 7,
          estimated_duration_to_days: 12,
          source_hash: `${prefix}-account-a11y`,
          status: "approved"
        })
        .select("id")
        .single();

      if (requestError || !request?.id) {
        throw new Error(`Failed to create account accessibility request: ${requestError?.message ?? "empty request"}`);
      }

      requestId = request.id;

      await adminClient.from("request_status_history").insert([
        {
          request_id: requestId,
          from_status: "new",
          to_status: "in_progress",
          changed_by_role: "manager"
        },
        {
          request_id: requestId,
          from_status: "in_progress",
          to_status: "approved",
          changed_by_role: "manager"
        }
      ]);

      await adminClient.from("order_contracts").insert({
        request_id: requestId,
        final_price: 42000,
        final_duration_days: 10,
        work_scope: "Temporary work scope for account detail accessibility smoke.",
        materials: "Temporary source files.",
        manager_comment: "Temporary manager comment.",
        status: "sent"
      });

      await loginAsClient(page, clientUser);
      await page.goto(`/account/requests/${requestId}`);
      await expect(page.getByRole("heading", { name: "Account accessibility" })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const blockingViolations = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? "")
      );

      expect(blockingViolations).toEqual([]);
    } finally {
      const requestIds = requestId ? [requestId] : [];

      await cleanupOrderAttachmentsForRequests(adminClient, requestIds);
      if (requestId) {
        await adminClient.from("requests").delete().eq("id", requestId);
      }
      await adminClient.from("requests").delete().like("source_hash", `${prefix}-%`);
      await deleteTestUsers(adminClient, users);
    }
  });
});
