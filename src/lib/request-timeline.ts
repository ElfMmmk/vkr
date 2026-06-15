import { requestStatusLabels } from "@/lib/request-status";
import type { OrderAttachment, OrderContract, OrderRequest, RequestStatusHistory } from "@/lib/types";

export type RequestTimelineEventType =
  | "attachment"
  | "contract"
  | "contract_feedback"
  | "created"
  | "status";

export type RequestTimelineEvent = {
  id: string;
  type: RequestTimelineEventType;
  title: string;
  description: string;
  createdAt: string;
};

function contractIsVisible(contract: OrderContract): boolean {
  return contract.status === "sent" || contract.status === "revision_requested" || contract.status === "accepted";
}

function buildStatusEvent(history: RequestStatusHistory): RequestTimelineEvent {
  const fromStatus = history.fromStatus ? requestStatusLabels[history.fromStatus] : "";
  const toStatus = requestStatusLabels[history.toStatus];

  return {
    id: `status-${history.id}`,
    type: "status",
    title: `Статус: ${toStatus}`,
    description: fromStatus ? `Изменён с «${fromStatus}» на «${toStatus}».` : `Установлен статус «${toStatus}».`,
    createdAt: history.createdAt
  };
}

function buildAttachmentEvent(attachment: OrderAttachment): RequestTimelineEvent {
  return {
    id: `attachment-${attachment.id}`,
    type: "attachment",
    title: "Материал загружен",
    description: attachment.fileName,
    createdAt: attachment.createdAt
  };
}

function buildContractEvents(contract: OrderContract | null | undefined): RequestTimelineEvent[] {
  if (!contract || !contractIsVisible(contract)) {
    return [];
  }

  const events: RequestTimelineEvent[] = [
    {
      id: `contract-created-${contract.id}`,
      type: "contract",
      title: "Договор-заказ подготовлен",
      description:
        contract.status === "accepted"
          ? "Финальные условия были отправлены на согласование."
          : "Финальные условия ожидают принятия.",
      createdAt: contract.createdAt
    }
  ];

  for (const feedback of contract.feedback) {
    events.push({
      id: `contract-feedback-${feedback.id}`,
      type: "contract_feedback",
      title: "Запрошены изменения договора-заказа",
      description: feedback.message,
      createdAt: feedback.createdAt
    });
  }

  const latestFeedback = contract.feedback.at(-1);
  if (
    latestFeedback
    && contract.updatedAt
    && contract.status !== "revision_requested"
    && new Date(contract.updatedAt).getTime() > new Date(latestFeedback.createdAt).getTime()
  ) {
    events.push({
      id: `contract-resent-${contract.id}-${contract.updatedAt}`,
      type: "contract",
      title: "Договор-заказ отправлен повторно",
      description: "Исправленные условия отправлены клиенту на повторное согласование.",
      createdAt: contract.updatedAt
    });
  }

  if (contract.acceptedAt) {
    events.push({
      id: `contract-accepted-${contract.id}`,
      type: "contract",
      title: "Договор-заказ принят",
      description: "Условия заказа согласованы клиентом.",
      createdAt: contract.acceptedAt
    });
  }

  return events;
}

export function buildRequestTimeline(request: OrderRequest): RequestTimelineEvent[] {
  const events: RequestTimelineEvent[] = [
    {
      id: `request-created-${request.id}`,
      type: "created",
      title: "Заявка создана",
      description: request.packageTitle
        ? `${request.serviceTitle || "Дизайн"} · ${request.packageTitle}`
        : request.serviceTitle || "Новая заявка",
      createdAt: request.createdAt
    },
    ...(request.statusHistory ?? []).map(buildStatusEvent),
    ...request.attachments.map(buildAttachmentEvent),
    ...buildContractEvents(request.contract)
  ];

  return events.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}
