import { mapRequest, type RequestRow } from "@/lib/data/mappers";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import type { OrderRequest } from "@/lib/types";

export async function listClientRequests(clientUserId: string): Promise<OrderRequest[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("requests")
    .select("*")
    .eq("client_user_id", clientUserId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data as RequestRow[] | null) ?? []).map(mapRequest);
}
