import Link from "next/link";

import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { FormSubmitButton } from "@/components/form-submit-button";
import { markNotificationReadAction } from "@/lib/actions/admin";
import { requireRequestManager } from "@/lib/auth";
import { listAdminNotifications } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

type AdminNotificationsPageProps = {
  searchParams: Promise<{
    filter?: string;
    page?: string;
  }>;
};

function notificationsHref(filter: "all" | "unread", page = 1): string {
  const params = new URLSearchParams();

  if (filter === "unread") {
    params.set("filter", "unread");
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/admin/notifications?${query}` : "/admin/notifications";
}

export default async function AdminNotificationsPage({
  searchParams
}: AdminNotificationsPageProps) {
  const admin = await requireRequestManager();
  const params = await searchParams;
  const filter = params.filter === "unread" ? "unread" : "all";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const result = await listAdminNotifications(admin.id, admin.role, {
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
    unreadOnly: filter === "unread"
  });
  const redirectTo = notificationsHref(filter, result.page);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Уведомления</p>
        <h1 className="mt-2 text-4xl font-semibold">Центр событий</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Непрочитанные: {result.unreadCount}
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Фильтр уведомлений">
        <Link
          aria-current={filter === "all" ? "page" : undefined}
          className={`focus-ring inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-semibold ${
            filter === "all" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
          }`}
          href={notificationsHref("all")}
        >
          Все
        </Link>
        <Link
          aria-current={filter === "unread" ? "page" : undefined}
          className={`focus-ring inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-semibold ${
            filter === "unread"
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink"
          }`}
          href={notificationsHref("unread")}
        >
          Непрочитанные
        </Link>
      </nav>

      <div className="divide-y divide-line border border-line bg-white">
        {result.items.map((notification) => (
          <article
            className={`grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${
              notification.readAt ? "bg-white" : "bg-cobalt/5"
            }`}
            key={notification.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{notification.title}</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {notification.readAt ? "Прочитано" : "Новое"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{notification.body}</p>
              <time className="mt-1 block text-xs text-muted" dateTime={notification.createdAt}>
                {new Date(notification.createdAt).toLocaleString("ru-RU")}
              </time>
            </div>
            <div className="flex flex-wrap gap-2">
              {notification.entityType === "request" && notification.entityId ? (
                <Link
                  className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                  href={`/admin/requests/${notification.entityId}`}
                >
                  Открыть заказ
                </Link>
              ) : null}
              {!notification.readAt ? (
                <form action={markNotificationReadAction}>
                  <AdminFormFieldset canWrite={admin.canManageRequests}>
                    <input name="id" type="hidden" value={notification.id} />
                    <input name="redirectTo" type="hidden" value={redirectTo} />
                    <FormSubmitButton
                      className={adminPrimaryButtonClass}
                      idleLabel="Прочитано"
                      pendingLabel="Сохранение..."
                    />
                  </AdminFormFieldset>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!result.items.length ? (
        <div className="border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">
            {filter === "unread" ? "Непрочитанных уведомлений нет" : "Уведомлений пока нет"}
          </h2>
          <p className="mt-2 text-muted">
            {filter === "unread"
              ? "Все уведомления прочитаны."
              : "Новые заявки и изменения статусов появятся здесь."}
          </p>
        </div>
      ) : null}

      {result.pageCount > 1 ? (
        <nav className="flex items-center justify-between gap-4" aria-label="Страницы уведомлений">
          {result.page > 1 ? (
            <Link
              className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold"
              href={notificationsHref(filter, result.page - 1)}
            >
              ← Назад
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">
            Страница {result.page} из {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Link
              className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold"
              href={notificationsHref(filter, result.page + 1)}
            >
              Далее →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
