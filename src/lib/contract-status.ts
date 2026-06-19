import type { Locale } from "@/lib/i18n";
import type { ContractStatus, OrderContractFeedback } from "@/lib/types";

export const contractStatusLabelsByLocale: Record<
  Locale,
  Record<ContractStatus, string>
> = {
  ru: {
    draft: "Черновик",
    sent: "На согласовании",
    revision_requested: "На доработке",
    accepted: "Принят",
    cancelled: "Отменён"
  },
  en: {
    draft: "Draft",
    sent: "Awaiting approval",
    revision_requested: "Revision requested",
    accepted: "Accepted",
    cancelled: "Cancelled"
  }
};

export const contractStatusLabels = contractStatusLabelsByLocale.ru;

export const contractFeedbackRoleLabelsByLocale: Record<
  Locale,
  Record<OrderContractFeedback["authorRole"], string>
> = {
  ru: {
    client: "Клиент",
    manager: "Дизайнер",
    admin: "Дизайнер"
  },
  en: {
    client: "Client",
    manager: "Designer",
    admin: "Designer"
  }
};

export const contractFeedbackRoleLabels = contractFeedbackRoleLabelsByLocale.ru;

export function getContractStatusLabel(
  status: ContractStatus,
  locale: Locale = "ru"
): string {
  return contractStatusLabelsByLocale[locale][status];
}

export function getContractFeedbackRoleLabel(
  role: OrderContractFeedback["authorRole"],
  locale: Locale = "ru"
): string {
  return contractFeedbackRoleLabelsByLocale[locale][role];
}
