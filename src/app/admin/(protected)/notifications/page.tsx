import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { FormSubmitButton } from "@/components/form-submit-button";
import { markNotificationReadAction } from "@/lib/actions/admin";
import { requireRequestManager } from "@/lib/auth";
import { listAdminNotifications } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const admin = await requireRequestManager();
  const notifications = await listAdminNotifications(admin.id, admin.role);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Уведомления</p>
        <h1 className="mt-2 text-4xl font-semibold">Центр событий</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Непрочитанных уведомлений: {unreadCount}
        </p>
      </div>
      <div className="grid gap-4">
        {notifications.map((notification) => (
          <AdminCard
            description={new Date(notification.createdAt).toLocaleString("ru-RU")}
            key={notification.id}
            title={notification.title}
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm leading-6 text-muted">{notification.body}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {notification.readAt ? "Прочитано" : "Новое"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {notification.entityType === "request" ? (
                  <Link
                    className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper"
                    href="/admin/requests"
                  >
                    К заявкам
                  </Link>
                ) : null}
                {!notification.readAt ? (
                  <form action={markNotificationReadAction}>
                    <AdminFormFieldset canWrite={admin.canManageRequests}>
                      <input name="id" type="hidden" value={notification.id} />
                      <FormSubmitButton
                        className={adminPrimaryButtonClass}
                        idleLabel="Отметить прочитанным"
                        pendingLabel="Сохранение..."
                      />
                    </AdminFormFieldset>
                  </form>
                ) : null}
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
      {!notifications.length ? (
        <div className="border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">Уведомлений пока нет</h2>
          <p className="mt-2 text-muted">Новые заявки и изменения статусов появятся здесь.</p>
        </div>
      ) : null}
    </div>
  );
}
