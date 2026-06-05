import type { NextRequest } from "next/server";

import {
  buildAnalyticsEventInsert,
  createAnalyticsSourceHash,
  parseAnalyticsEventPayload
} from "@/lib/analytics-events";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function noContent(): Response {
  return new Response(null, { status: 204 });
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const event = parseAnalyticsEventPayload(body);

  if (!event) {
    return noContent();
  }

  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return noContent();
  }

  const sourceHash = createAnalyticsSourceHash({
    forwardedFor: request.headers.get("x-forwarded-for") ?? "",
    realIp: request.headers.get("x-real-ip") ?? "",
    userAgent: request.headers.get("user-agent") ?? ""
  });
  const { error } = await client.from("analytics_events").insert(
    buildAnalyticsEventInsert(event, sourceHash)
  );

  if (error) {
    console.error("[analytics]", "event insert failed", error.message);
  }

  return noContent();
}
