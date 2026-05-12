import { AdminCard } from "@/components/admin-card";
import { requireRequestManager } from "@/lib/auth";
import {
  listAdminImages,
  listAdminProjects,
  listAdminRequests,
  listAdminServices
} from "@/lib/data/admin";
import { requestStatusLabels, requestStatuses } from "@/lib/request-status";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireRequestManager();
  const [requests, services, projects, images] = await Promise.all([
    listAdminRequests({}),
    listAdminServices(),
    listAdminProjects(),
    listAdminImages()
  ]);
  const requestsByStatus = requestStatuses.map((status) => ({
    status,
    label: requestStatusLabels[status],
    count: requests.filter((request) => request.status === status).length
  }));
  const requestsByService = services
    .map((service) => ({
      title: service.title,
      count: requests.filter((request) => request.serviceId === service.id).length
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      label: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      count: requests.filter((request) => request.createdAt.slice(0, 10) === key).length
    };
  });
  const maxDaily = Math.max(1, ...lastSevenDays.map((day) => day.count));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Аналитика</p>
        <h1 className="mt-2 text-4xl font-semibold">Заявки и контент</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Всего заявок", value: requests.length },
          { label: "Новых", value: requestsByStatus.find((item) => item.status === "new")?.count ?? 0 },
          { label: "Опубликовано проектов", value: projects.filter((project) => project.isPublished).length },
          { label: "Файлов в медиатеке", value: images.length }
        ].map((metric) => (
          <div className="border border-line bg-white p-5" key={metric.label}>
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-3 text-4xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Статусы заявок">
          <div className="grid gap-3">
            {requestsByStatus.map((item) => (
              <div className="grid grid-cols-[1fr_auto] gap-4 text-sm" key={item.status}>
                <span className="text-muted">{item.label}</span>
                <span className="font-semibold text-ink">{item.count}</span>
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard title="Заявки по услугам">
          {requestsByService.length ? (
            <div className="grid gap-3">
              {requestsByService.map((item) => (
                <div className="grid grid-cols-[1fr_auto] gap-4 text-sm" key={item.title}>
                  <span className="text-muted">{item.title}</span>
                  <span className="font-semibold text-ink">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">По услугам пока нет заявок.</p>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Динамика за 7 дней">
        <div className="grid grid-cols-7 gap-3">
          {lastSevenDays.map((day) => (
            <div className="grid gap-2" key={day.key}>
              <div className="flex h-32 items-end border border-line bg-paper px-2 py-2">
                <div
                  aria-label={`${day.label}: ${day.count}`}
                  className="w-full bg-accent"
                  style={{ height: `${Math.max(8, (day.count / maxDaily) * 100)}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted">{day.label}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
