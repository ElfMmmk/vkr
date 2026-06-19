import type { NextRequest } from "next/server";

import { requireRequestManager } from "@/lib/auth";
import { listAdminRequests } from "@/lib/data/admin";
import { createRequestsWorkbookBuffer } from "@/lib/request-export-workbook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  await requireRequestManager();
  const searchParams = request.nextUrl.searchParams;
  const requests = await listAdminRequests({
    query: searchParams.get("query") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") === "oldest" ? "oldest" : "newest",
    limit: null
  });
  const buffer = await createRequestsWorkbookBuffer(requests);
  const filename = `requests-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-store"
    }
  });
}
