import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import type { AdminNotification } from "@/lib/types";
import type { UserRole } from "@/lib/auth";

type NotificationRow = {
  id: string;
  type: AdminNotification["type"];
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  audience_role: "admin" | "manager";
  created_at: string;
};

type NotificationReadRow = {
  notification_id: string;
  read_at: string;
};

export async function listAdminNotifications(
  userId: string,
  role: UserRole
): Promise<AdminNotification[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client || role === "client") {
    return [];
  }

  let query = client
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (role === "manager") {
    query = query.eq("audience_role", "manager");
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return [];
  }

  const ids = (data as NotificationRow[]).map((notification) => notification.id);
  const { data: reads } = await client
    .from("notification_reads")
    .select("notification_id, read_at")
    .eq("user_id", userId)
    .in("notification_id", ids);
  const readById = new Map(
    ((reads as NotificationReadRow[] | null) ?? []).map((read) => [
      read.notification_id,
      read.read_at
    ])
  );

  return (data as NotificationRow[]).map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? "",
    entityType: notification.entity_type ?? "",
    entityId: notification.entity_id,
    audienceRole: notification.audience_role,
    createdAt: notification.created_at,
    readAt: readById.get(notification.id) ?? null
  }));
}
