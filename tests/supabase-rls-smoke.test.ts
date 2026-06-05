import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { noopRealtimeTransport } from "./supabase-test-transport";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const shouldRun =
  process.env.SUPABASE_RLS_SMOKE === "1" && Boolean(supabaseUrl && publicKey && secretKey);
const describeRlsSmoke = shouldRun ? describe : describe.skip;

type AppClient = SupabaseClient<Database>;

function createPublicClient(): AppClient {
  return createClient<Database>(supabaseUrl, publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: noopRealtimeTransport
    }
  });
}

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

async function createTemporaryUser(
  adminClient: AppClient,
  prefix: string,
  label: string
): Promise<{ id: string; email: string; password: string }> {
  const email = `${prefix}-${label}@example.test`;
  const password = `${randomUUID()}Aa1!`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `RLS Smoke ${label}`
    }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create temporary ${label} user: ${error?.message ?? "empty user"}`);
  }

  await adminClient.from("profiles").upsert({
    id: data.user.id,
    email,
    full_name: `RLS Smoke ${label}`,
    role: "client"
  });

  return {
    id: data.user.id,
    email,
    password
  };
}

async function createAuthenticatedClient(user: {
  email: string;
  password: string;
}): Promise<AppClient> {
  const client = createPublicClient();
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password
  });

  if (error) {
    throw new Error(`Failed to sign in temporary user: ${error.message}`);
  }

  return client;
}

describeRlsSmoke("live Supabase RLS smoke", () => {
  it("enforces request and profile policies for anon and authenticated clients", async () => {
    const adminClient = createAdminClient();
    const publicClient = createPublicClient();
    const prefix = `rls-smoke-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const createdUserIds: string[] = [];
    const createdRequestIds: string[] = [];

    try {
      const [ownerUser, otherUser] = await Promise.all([
        createTemporaryUser(adminClient, prefix, "owner"),
        createTemporaryUser(adminClient, prefix, "other")
      ]);
      createdUserIds.push(ownerUser.id, otherUser.id);

      const ownerClient = await createAuthenticatedClient(ownerUser);
      const anonSourceHash = `${prefix}-anon`;
      const { error: anonInsertError } = await publicClient.from("requests").insert({
        client_name: "Anon Smoke",
        contact_method: "email",
        contact_value: `${prefix}-anon@example.test`,
        service_id: null,
        service_title: "RLS smoke",
        comment: "Anonymous direct insert should be rejected.",
        source_hash: anonSourceHash,
        status: "new"
      });

      expect(anonInsertError).not.toBeNull();

      const { error: ownerInsertError } = await ownerClient.from("requests").insert({
        client_name: "Owner Smoke",
        contact_method: "email",
        contact_value: `${prefix}-owner-direct@example.test`,
        service_id: null,
        service_title: "RLS smoke",
        comment: "Authenticated direct insert should be rejected.",
        client_user_id: ownerUser.id,
        source_hash: `${prefix}-owner-direct`,
        status: "new"
      });

      expect(ownerInsertError).not.toBeNull();

      const { error: spoofedRequestError } = await ownerClient.from("requests").insert({
        client_name: "Spoofed Smoke",
        contact_method: "email",
        contact_value: `${prefix}-spoofed@example.test`,
        service_id: null,
        service_title: "RLS smoke",
        comment: "Authenticated client must not insert as another user.",
        client_user_id: otherUser.id,
        source_hash: `${prefix}-spoofed`,
        status: "new"
      });

      expect(spoofedRequestError).not.toBeNull();

      const { data: ownRequest, error: ownRequestError } = await adminClient
        .from("requests")
        .insert({
          client_name: "Owner Smoke",
          contact_method: "email",
          contact_value: `${prefix}-owner@example.test`,
          service_id: null,
          service_title: "RLS smoke",
          comment: "Service role should create rows for the server action.",
          client_user_id: ownerUser.id,
          source_hash: `${prefix}-owner`,
          status: "new"
        })
        .select("id")
        .single();

      expect(ownRequestError).toBeNull();
      expect(ownRequest?.id).toBeTruthy();

      if (ownRequest?.id) {
        createdRequestIds.push(ownRequest.id);
      }

      const { data: otherRequest, error: otherRequestError } = await adminClient
        .from("requests")
        .insert({
          client_name: "Other Smoke",
          contact_method: "email",
          contact_value: `${prefix}-other@example.test`,
          service_id: null,
          service_title: "RLS smoke",
          comment: "This row belongs to another user.",
          client_user_id: otherUser.id,
          source_hash: `${prefix}-other`,
          status: "new"
        })
        .select("id")
        .single();

      expect(otherRequestError).toBeNull();
      expect(otherRequest?.id).toBeTruthy();

      if (otherRequest?.id) {
        createdRequestIds.push(otherRequest.id);
      }

      const { data: visibleOwnRows, error: visibleOwnRowsError } = await ownerClient
        .from("requests")
        .select("id")
        .eq("id", ownRequest?.id ?? "");

      expect(visibleOwnRowsError).toBeNull();
      expect(visibleOwnRows).toEqual([{ id: ownRequest?.id }]);

      const { data: visibleOtherRows, error: visibleOtherRowsError } = await ownerClient
        .from("requests")
        .select("id")
        .eq("id", otherRequest?.id ?? "");

      expect(visibleOtherRowsError).toBeNull();
      expect(visibleOtherRows).toEqual([]);

      const { error: roleUpdateError } = await ownerClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", ownerUser.id);

      expect(roleUpdateError).not.toBeNull();
    } finally {
      if (createdRequestIds.length > 0) {
        await adminClient.from("requests").delete().in("id", createdRequestIds);
      }

      await adminClient.from("requests").delete().like("source_hash", `${prefix}-%`);

      if (createdUserIds.length > 0) {
        await adminClient.from("profiles").delete().in("id", createdUserIds);

        for (const userId of createdUserIds) {
          await adminClient.auth.admin.deleteUser(userId);
        }
      }
    }
  }, 60_000);
});
