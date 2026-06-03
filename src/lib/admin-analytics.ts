import { requestStatusLabels, requestStatuses } from "@/lib/request-status";
import type {
  OrderRequest,
  PortfolioImage,
  Project,
  RequestStatus,
  Service
} from "@/lib/types";

export const adminAnalyticsPeriods = ["7", "30", "90", "all"] as const;

export type AdminAnalyticsPeriod = (typeof adminAnalyticsPeriods)[number];

export const adminAnalyticsPeriodLabels: Record<AdminAnalyticsPeriod, string> = {
  "7": "7 дней",
  "30": "30 дней",
  "90": "90 дней",
  all: "Всё время"
};

export type AdminAttentionReason = "new_request" | "sent_contract" | "stale_in_progress";

export type AdminAttentionItem = {
  id: string;
  href: string;
  title: string;
  meta: string;
  reason: AdminAttentionReason;
  reasonLabel: string;
  createdAt: string;
};

export type AdminAnalytics = {
  period: AdminAnalyticsPeriod;
  periodLabel: string;
  kpis: {
    totalRequests: number;
    newRequests: number;
    completedRequests: number;
    acceptedContracts: number;
    acceptedContractValue: number;
    averageEstimate: number;
    publishedProjects: number;
    mediaFiles: number;
  };
  statuses: Array<{
    status: RequestStatus;
    label: string;
    count: number;
  }>;
  services: Array<{
    id: string;
    title: string;
    count: number;
  }>;
  trend: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  attentionItems: AdminAttentionItem[];
};

const defaultPeriod: AdminAnalyticsPeriod = "30";
const staleInProgressDays = 7;

const attentionReasonLabels: Record<AdminAttentionReason, string> = {
  new_request: "Новая заявка",
  sent_contract: "Договор ждёт принятия",
  stale_in_progress: "Долго в обработке"
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);

  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);

  return copy;
}

function getPeriodStart(now: Date, period: AdminAnalyticsPeriod): Date | null {
  if (period === "all") {
    return null;
  }

  return addDays(startOfDay(now), -(Number(period) - 1));
}

function isInsidePeriod(request: OrderRequest, periodStart: Date | null, now: Date): boolean {
  const createdAt = new Date(request.createdAt);

  return (!periodStart || createdAt >= periodStart) && createdAt <= now;
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function getEstimateValue(request: OrderRequest): number | null {
  const values = [request.estimatedPriceFrom, request.estimatedPriceTo].filter(
    (value): value is number => typeof value === "number"
  );

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTrendStart(requests: OrderRequest[], periodStart: Date | null, now: Date): Date {
  if (periodStart) {
    return periodStart;
  }

  const earliestRequest = requests
    .map((request) => new Date(request.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return startOfDay(earliestRequest ?? now);
}

function buildTrend(requests: OrderRequest[], periodStart: Date | null, now: Date) {
  const start = getTrendStart(requests, periodStart, now);
  const days = Math.max(
    1,
    Math.floor((startOfDay(now).getTime() - start.getTime()) / 86_400_000) + 1
  );
  const counts = new Map<string, number>();

  for (const request of requests) {
    const key = request.createdAt.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    const key = formatDayKey(date);

    return {
      key,
      label: formatDayLabel(date),
      count: counts.get(key) ?? 0
    };
  });
}

function buildServiceDistribution(requests: OrderRequest[], services: Service[]) {
  const serviceTitles = new Map(services.map((service) => [service.id, service.title]));
  const counts = new Map<string, { id: string; title: string; count: number }>();

  for (const service of services) {
    counts.set(service.id, { id: service.id, title: service.title, count: 0 });
  }

  for (const request of requests) {
    const id = request.serviceId ?? "unknown";
    const title = serviceTitles.get(id) ?? (request.serviceTitle || "Не выбрана");
    const current = counts.get(id) ?? { id, title, count: 0 };
    counts.set(id, { ...current, count: current.count + 1 });
  }

  return Array.from(counts.values())
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ru"));
}

function getAttentionMeta(request: OrderRequest): string {
  const date = new Date(request.createdAt).toLocaleDateString("ru-RU");
  const service = request.serviceTitle || "услуга не выбрана";

  return `${date} · ${service}`;
}

function buildAttentionItems(requests: OrderRequest[], now: Date): AdminAttentionItem[] {
  const staleStart = addDays(startOfDay(now), -staleInProgressDays);
  const items: AdminAttentionItem[] = [];

  for (const request of requests) {
    const baseItem = {
      id: request.id,
      href: `/admin/requests/${request.id}`,
      title: request.clientName || request.contactValue || "Заявка без имени",
      meta: getAttentionMeta(request),
      createdAt: request.createdAt
    };

    if (request.status === "new") {
      items.push({
        ...baseItem,
        reason: "new_request",
        reasonLabel: attentionReasonLabels.new_request
      });
    }

    if (request.contract?.status === "sent") {
      items.push({
        ...baseItem,
        reason: "sent_contract",
        reasonLabel: attentionReasonLabels.sent_contract
      });
    }

    if (request.status === "in_progress" && new Date(request.createdAt) <= staleStart) {
      items.push({
        ...baseItem,
        reason: "stale_in_progress",
        reasonLabel: attentionReasonLabels.stale_in_progress
      });
    }
  }

  const priority: Record<AdminAttentionReason, number> = {
    new_request: 0,
    sent_contract: 1,
    stale_in_progress: 2
  };

  return items.sort((a, b) => {
    if (priority[a.reason] !== priority[b.reason]) {
      return priority[a.reason] - priority[b.reason];
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function parseAdminAnalyticsPeriod(value: string | string[] | undefined): AdminAnalyticsPeriod {
  const period = Array.isArray(value) ? value[0] : value;

  return adminAnalyticsPeriods.includes(period as AdminAnalyticsPeriod)
    ? (period as AdminAnalyticsPeriod)
    : defaultPeriod;
}

export function toAdminAnalyticsSearchParams(period: AdminAnalyticsPeriod): URLSearchParams {
  const params = new URLSearchParams();

  if (period !== defaultPeriod) {
    params.set("period", period);
  }

  return params;
}

export function buildAdminAnalytics({
  images,
  now = new Date(),
  period,
  projects,
  requests,
  services
}: {
  images: PortfolioImage[];
  now?: Date;
  period: AdminAnalyticsPeriod;
  projects: Project[];
  requests: OrderRequest[];
  services: Service[];
}): AdminAnalytics {
  const periodStart = getPeriodStart(now, period);
  const periodRequests = requests.filter((request) => isInsidePeriod(request, periodStart, now));
  const acceptedContracts = periodRequests.filter(
    (request) => request.contract?.status === "accepted"
  );
  const estimateValues = periodRequests
    .map(getEstimateValue)
    .filter((value): value is number => typeof value === "number");
  const averageEstimate = estimateValues.length
    ? Math.round(estimateValues.reduce((sum, value) => sum + value, 0) / estimateValues.length)
    : 0;

  return {
    period,
    periodLabel: adminAnalyticsPeriodLabels[period],
    kpis: {
      totalRequests: periodRequests.length,
      newRequests: periodRequests.filter((request) => request.status === "new").length,
      completedRequests: periodRequests.filter((request) => request.status === "completed").length,
      acceptedContracts: acceptedContracts.length,
      acceptedContractValue: acceptedContracts.reduce(
        (sum, request) => sum + (request.contract?.finalPrice ?? 0),
        0
      ),
      averageEstimate,
      publishedProjects: projects.filter((project) => project.isPublished).length,
      mediaFiles: images.length
    },
    statuses: requestStatuses.map((status) => ({
      status,
      label: requestStatusLabels[status],
      count: periodRequests.filter((request) => request.status === status).length
    })),
    services: buildServiceDistribution(periodRequests, services),
    trend: buildTrend(periodRequests, periodStart, now),
    attentionItems: buildAttentionItems(periodRequests, now)
  };
}
