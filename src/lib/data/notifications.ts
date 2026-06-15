import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import { isRequestStatus, requestStatusLabels } from "@/lib/request-status";
import type { AdminNotification } from "@/lib/types";
import type { UserRole } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/database.types";

type NotificationRow = Tables<"notifications">;
type NotificationReadRow = Pick<Tables<"notification_reads">, "notification_id" | "read_at">;

export type AdminNotificationListResult = {
  items: AdminNotification[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  unreadCount: number;
};

export function localizeNotificationBody(notification: AdminNotification): string {
  if (notification.type !== "request_status_changed") {
    return notification.body;
  }

  const match = notification.body.match(/\b(new|in_progress|approved|in_work|completed|rejected)\b/);

  if (!match || !isRequestStatus(match[1])) {
    return notification.body;
  }

  return `Заявка переведена в статус «${requestStatusLabels[match[1]]}».`;
}

export async function listAdminNotifications(
  userId: string,
  role: UserRole,
  options: {
    page?: number;
    pageSize?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<AdminNotificationListResult> {
  const client = getOptionalSupabaseAdmin();
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 12, 50));

  if (!client || role === "client") {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize,
      pageCount: 1,
      unreadCount: 0
    };
  }

  let query = client
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (role === "manager") {
    query = query.eq("audience_role", "manager");
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize,
      pageCount: 1,
      unreadCount: 0
    };
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

  const mapped = (data as NotificationRow[]).map((notification) => {
    const item: AdminNotification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? "",
      entityType: notification.entity_type ?? "",
      entityId: notification.entity_id,
      audienceRole: notification.audience_role,
      createdAt: notification.created_at,
      readAt: readById.get(notification.id) ?? null
    };

    return {
      ...item,
      body: localizeNotificationBody(item)
    };
  });
  const unreadCount = mapped.filter((notification) => !notification.readAt).length;
  const filtered = options.unreadOnly
    ? mapped.filter((notification) => !notification.readAt)
    : mapped;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, options.page ?? 1), pageCount);
  const from = (page - 1) * pageSize;

  return {
    items: filtered.slice(from, from + pageSize),
    total: filtered.length,
    page,
    pageSize,
    pageCount,
    unreadCount
  };
}
