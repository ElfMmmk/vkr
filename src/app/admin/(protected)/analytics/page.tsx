import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import {
  adminAnalyticsPeriodLabels,
  adminAnalyticsPeriods,
  buildAdminAnalytics,
  parseAdminAnalyticsPeriod,
  toAdminAnalyticsSearchParams,
  type AdminAnalyticsPeriod
} from "@/lib/admin-analytics";
import { requireRequestManager } from "@/lib/auth";
import {
  listAdminAnalyticsEvents,
  listAdminImages,
  listAdminProjects,
  listAdminRequests,
  listAdminServices
} from "@/lib/data/admin";

export const dynamic = "force-dynamic";

type AdminAnalyticsPageProps = {
  searchParams: Promise<{
    period?: string | string[];
  }>;
};

function periodHref(period: AdminAnalyticsPeriod): string {
  const params = toAdminAnalyticsSearchParams(period);
  const query = params.toString();

  return query ? `/admin/analytics?${query}` : "/admin/analytics";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  await requireRequestManager();
  const params = await searchParams;
  const period = parseAdminAnalyticsPeriod(params.period);
  const [requests, services, projects, images, analyticsEvents] = await Promise.all([
    listAdminRequests({ limit: null }),
    listAdminServices(),
    listAdminProjects(),
    listAdminImages(),
    listAdminAnalyticsEvents()
  ]);
  const analytics = buildAdminAnalytics({
    analyticsEvents,
    images,
    period,
    projects,
    requests,
    services
  });
  const maxDaily = Math.max(1, ...analytics.trend.map((day) => day.count));
  const kpiCards = [
    {
      label: "Всего заявок",
      meta: analytics.periodLabel,
      value: formatNumber(analytics.kpis.totalRequests)
    },
    {
      label: "Новые",
      meta: "ожидают обработки",
      value: formatNumber(analytics.kpis.newRequests)
    },
    {
      label: "Завершённые",
      meta: analytics.periodLabel,
      value: formatNumber(analytics.kpis.completedRequests)
    },
    {
      label: "Принятые заказы",
      meta: "клиент согласовал",
      value: formatNumber(analytics.kpis.acceptedContracts)
    },
    {
      label: "Сумма заказов",
      meta: "по принятым заказам",
      value: formatCurrency(analytics.kpis.acceptedContractValue)
    },
    {
      label: "Средний чек",
      meta: "по принятым заказам",
      value: formatCurrency(analytics.kpis.averageAcceptedOrderValue)
    },
    {
      label: "Проектов опубликовано",
      meta: "текущая витрина",
      value: formatNumber(analytics.kpis.publishedProjects)
    },
    {
      label: "Файлов в медиатеке",
      meta: "загруженные изображения",
      value: formatNumber(analytics.kpis.mediaFiles)
    },
    {
      label: "Просмотры страниц",
      meta: analytics.periodLabel,
      value: formatNumber(analytics.traffic.totalPageViews)
    },
    {
      label: "Уникальные посетители",
      meta: "по дневному хешу источника",
      value: formatNumber(analytics.traffic.uniqueVisitors)
    },
    {
      label: "Клики по кнопкам",
      meta: analytics.periodLabel,
      value: formatNumber(analytics.traffic.ctaClicks)
    },
    {
      label: "Конверсия кнопок",
      meta: "доля кликов от просмотров",
      value: formatPercent(analytics.traffic.ctaClickRate)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Аналитика</p>
          <h1 className="mt-2 text-4xl font-semibold">Заявки, заказы и контент</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Панель показывает показатели по текущим заявкам, заказам,
            контенту и публичному трафику сайта.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Период аналитики">
          {adminAnalyticsPeriods.map((item) => {
            const isActive = item === analytics.period;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`focus-ring inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-semibold transition active:translate-y-px ${
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-ink hover:bg-paper"
                }`}
                href={periodHref(item)}
                key={item}
              >
                {adminAnalyticsPeriodLabels[item]}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((metric) => (
          <div className="border border-line bg-white p-5" key={metric.label}>
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-3 break-words text-3xl font-semibold">{metric.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{metric.meta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard title="Топ страниц" description={`Период: ${analytics.periodLabel}`}>
          {analytics.traffic.topPages.length ? (
            <div className="grid gap-3">
              {analytics.traffic.topPages.map((item) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm" key={item.path}>
                  <span className="min-w-0 truncate text-muted">{item.path}</span>
                  <span className="font-semibold text-ink">{formatNumber(item.views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">За выбранный период просмотров публичных страниц пока нет.</p>
          )}
        </AdminCard>

        <AdminCard title="Популярные кнопки" description={`Период: ${analytics.periodLabel}`}>
          {analytics.traffic.topCtas.length ? (
            <div className="grid gap-3">
              {analytics.traffic.topCtas.map((item) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm"
                  key={`${item.href}-${item.label}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{item.label}</span>
                    <span className="mt-1 block truncate text-muted">{item.href}</span>
                  </span>
                  <span className="font-semibold text-ink">{formatNumber(item.clicks)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">За выбранный период кликов по кнопкам пока нет.</p>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard title="Статусы заявок" description={`Период: ${analytics.periodLabel}`}>
          <div className="grid gap-3">
            {analytics.statuses.map((item) => (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm" key={item.status}>
                <span className="text-muted">{item.label}</span>
                <span className="font-semibold text-ink">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Заявки по услугам" description={`Период: ${analytics.periodLabel}`}>
          {analytics.services.length ? (
            <div className="grid gap-3">
              {analytics.services.map((item) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm" key={item.id}>
                  <span className="min-w-0 truncate text-muted">{item.title}</span>
                  <span className="font-semibold text-ink">{formatNumber(item.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">По услугам за выбранный период заявок нет.</p>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Требуют внимания" description="Быстрый список заявок для ежедневной работы">
        {analytics.attentionItems.length ? (
          <div className="divide-y divide-line border border-line">
            {analytics.attentionItems.slice(0, 8).map((item) => (
              <Link
                className="focus-ring grid gap-2 bg-white p-4 text-sm transition hover:bg-paper md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center"
                href={item.href}
                key={`${item.reason}-${item.id}`}
              >
                <span className="w-fit border border-line bg-paper px-2 py-1 text-xs font-semibold text-ink">
                  {item.reasonLabel}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{item.title}</span>
                  <span className="mt-1 block truncate text-muted">{item.meta}</span>
                </span>
                <span className="text-sm font-semibold text-accent">Открыть</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-line bg-paper p-8 text-center">
            <h2 className="text-xl font-semibold">Нет срочных задач</h2>
            <p className="mt-2 text-sm text-muted">
              За выбранный период нет новых заявок, отправленных заказов без принятия и старых
              заявок в обработке.
            </p>
          </div>
        )}
      </AdminCard>

      <AdminCard title="Динамика заявок" description={`Период: ${analytics.periodLabel}`}>
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px] gap-2"
            style={{
              gridTemplateColumns: `repeat(${analytics.trend.length}, minmax(42px, 1fr))`
            }}
          >
            {analytics.trend.map((day) => (
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
        </div>
      </AdminCard>
    </div>
  );
}
