import type { RequestStatus } from "@/lib/types";

export const requestStatuses: RequestStatus[] = [
  "new",
  "in_progress",
  "approved",
  "completed",
  "rejected"
];

export const requestStatusLabels: Record<RequestStatus, string> = {
  new: "Новая",
  in_progress: "В обработке",
  approved: "Согласована",
  completed: "Завершена",
  rejected: "Отклонена"
};

export function isRequestStatus(value: string): value is RequestStatus {
  return requestStatuses.includes(value as RequestStatus);
}
