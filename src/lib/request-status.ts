import type { RequestStatus } from "@/lib/types";

export const requestStatuses: RequestStatus[] = [
  "new",
  "in_progress",
  "approved",
  "in_work",
  "completed",
  "rejected"
];

export const requestStatusLabels: Record<RequestStatus, string> = {
  new: "Новая",
  in_progress: "В обработке",
  approved: "Согласована",
  in_work: "В работе",
  completed: "Завершена",
  rejected: "Отклонена"
};

export function formatRequestStatusChangeBody(status: RequestStatus): string {
  return `Заявка переведена в статус «${requestStatusLabels[status]}».`;
}

export function isRequestStatus(value: string): value is RequestStatus {
  return requestStatuses.includes(value as RequestStatus);
}
