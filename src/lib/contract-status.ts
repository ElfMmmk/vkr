import type { ContractStatus, OrderContractFeedback } from "@/lib/types";

export const contractStatusLabels: Record<ContractStatus, string> = {
  draft: "Черновик",
  sent: "На согласовании",
  revision_requested: "На доработке",
  accepted: "Принят",
  cancelled: "Отменён"
};

export const contractFeedbackRoleLabels: Record<
  OrderContractFeedback["authorRole"],
  string
> = {
  client: "Клиент",
  manager: "Дизайнер",
  admin: "Дизайнер"
};
