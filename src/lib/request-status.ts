import type { Locale } from "@/lib/i18n";
import type { RequestStatus } from "@/lib/types";

export const requestStatuses: RequestStatus[] = [
  "new",
  "in_progress",
  "approved",
  "in_work",
  "completed",
  "rejected"
];

export const requestStatusLabelsByLocale: Record<
  Locale,
  Record<RequestStatus, string>
> = {
  ru: {
    new: "Новая",
    in_progress: "В обработке",
    approved: "Согласована",
    in_work: "В работе",
    completed: "Завершена",
    rejected: "Отклонена"
  },
  en: {
    new: "New",
    in_progress: "In review",
    approved: "Approved",
    in_work: "In progress",
    completed: "Completed",
    rejected: "Rejected"
  }
};

export const requestStatusLabels = requestStatusLabelsByLocale.ru;

export function getRequestStatusLabel(
  status: RequestStatus,
  locale: Locale = "ru"
): string {
  return requestStatusLabelsByLocale[locale][status];
}

export function formatRequestStatusChangeBody(status: RequestStatus): string {
  return `Заявка переведена в статус «${requestStatusLabels[status]}».`;
}

export function isRequestStatus(value: string): value is RequestStatus {
  return requestStatuses.includes(value as RequestStatus);
}
