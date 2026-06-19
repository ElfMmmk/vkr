import type { Locale } from "@/lib/i18n";
import { getRequestStatusLabel } from "@/lib/request-status";
import type { OrderAttachment, OrderContract, OrderRequest, RequestStatusHistory } from "@/lib/types";

export type RequestTimelineEventType =
  | "attachment"
  | "contract"
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

const timelineCopy = {
  ru: {
    status: "Статус",
    changedFrom: (from: string, to: string) => `Изменён с «${from}» на «${to}».`,
    statusSet: (status: string) => `Установлен статус «${status}».`,
    attachmentUploaded: "Материал загружен",
    termsSent: "Условия отправлены на согласование",
    termsSentAccepted: "Финальные условия были отправлены на согласование.",
    termsAwaiting: "Финальные условия ожидают принятия.",
    termsResent: "Условия обновлены и отправлены",
    termsResentDescription: "Исправленные условия отправлены клиенту на повторное согласование.",
    termsAccepted: "Условия приняты",
    termsAcceptedDescription: "Условия заказа согласованы клиентом.",
    requestCreated: "Заявка создана",
    design: "Дизайн",
    newRequest: "Новая заявка"
  },
  en: {
    status: "Status",
    changedFrom: (from: string, to: string) => `Changed from “${from}” to “${to}”.`,
    statusSet: (status: string) => `Status set to “${status}”.`,
    attachmentUploaded: "File uploaded",
    termsSent: "Order terms sent for approval",
    termsSentAccepted: "The final order terms were sent for approval.",
    termsAwaiting: "The final order terms are awaiting approval.",
    termsResent: "Updated order terms sent",
    termsResentDescription: "The revised order terms were sent for approval again.",
    termsAccepted: "Order terms accepted",
    termsAcceptedDescription: "The client accepted the order terms.",
    requestCreated: "Order created",
    design: "Design",
    newRequest: "New order"
  }
} as const;

function buildStatusEvent(
  history: RequestStatusHistory,
  locale: Locale
): RequestTimelineEvent {
  const copy = timelineCopy[locale];
  const fromStatus = history.fromStatus
    ? getRequestStatusLabel(history.fromStatus, locale)
    : "";
  const toStatus = getRequestStatusLabel(history.toStatus, locale);

  return {
    id: `status-${history.id}`,
    type: "status",
    title: `${copy.status}: ${toStatus}`,
    description: fromStatus
      ? copy.changedFrom(fromStatus, toStatus)
      : copy.statusSet(toStatus),
    createdAt: history.createdAt
  };
}

function buildAttachmentEvent(
  attachment: OrderAttachment,
  locale: Locale
): RequestTimelineEvent {
  return {
    id: `attachment-${attachment.id}`,
    type: "attachment",
    title: timelineCopy[locale].attachmentUploaded,
    description: attachment.fileName,
    createdAt: attachment.createdAt
  };
}

function buildContractEvents(
  contract: OrderContract | null | undefined,
  locale: Locale
): RequestTimelineEvent[] {
  if (!contract || !contractIsVisible(contract)) {
    return [];
  }

  const copy = timelineCopy[locale];
  const events: RequestTimelineEvent[] = [
    {
      id: `contract-created-${contract.id}`,
      type: "contract",
      title: copy.termsSent,
      description:
        contract.status === "accepted"
          ? copy.termsSentAccepted
          : copy.termsAwaiting,
      createdAt: contract.createdAt
    }
  ];

  const latestFeedback = contract.feedback.at(-1);
  const updatedAtTime = contract.updatedAt ? new Date(contract.updatedAt).getTime() : 0;
  const acceptedAtTime = contract.acceptedAt ? new Date(contract.acceptedAt).getTime() : 0;
  const updatePrecedesAcceptance = !acceptedAtTime || updatedAtTime < acceptedAtTime;
  if (
    latestFeedback
    && contract.updatedAt
    && contract.status !== "revision_requested"
    && updatedAtTime > new Date(latestFeedback.createdAt).getTime()
    && updatePrecedesAcceptance
  ) {
    events.push({
      id: `contract-resent-${contract.id}-${contract.updatedAt}`,
      type: "contract",
      title: copy.termsResent,
      description: copy.termsResentDescription,
      createdAt: contract.updatedAt
    });
  }

  if (contract.acceptedAt) {
    events.push({
      id: `contract-accepted-${contract.id}`,
      type: "contract",
      title: copy.termsAccepted,
      description: copy.termsAcceptedDescription,
      createdAt: contract.acceptedAt
    });
  }

  return events;
}

export function buildRequestTimeline(
  request: OrderRequest,
  locale: Locale = "ru"
): RequestTimelineEvent[] {
  const copy = timelineCopy[locale];
  const events: RequestTimelineEvent[] = [
    {
      id: `request-created-${request.id}`,
      type: "created",
      title: copy.requestCreated,
      description: request.packageTitle
        ? `${request.serviceTitle || copy.design} · ${request.packageTitle}`
        : request.serviceTitle || copy.newRequest,
      createdAt: request.createdAt
    },
    ...(request.statusHistory ?? []).map((history) => buildStatusEvent(history, locale)),
    ...request.attachments.map((attachment) => buildAttachmentEvent(attachment, locale)),
    ...buildContractEvents(request.contract, locale)
  ];

  return events.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
