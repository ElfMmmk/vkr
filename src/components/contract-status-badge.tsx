import { contractStatusLabels } from "@/lib/contract-status";
import type { ContractStatus } from "@/lib/types";

const styles: Record<ContractStatus, string> = {
  draft: "border-line bg-paper text-muted",
  sent: "border-cobalt/30 bg-cobalt/10 text-cobalt",
  revision_requested: "border-amber-500/30 bg-amber-100 text-amber-800",
  accepted: "border-emerald-500/30 bg-emerald-100 text-emerald-800",
  cancelled: "border-accent/30 bg-accent/10 text-accent"
};

export function ContractStatusBadge({ status }: { status?: ContractStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-muted">
        Заказ: не создан
      </span>
    );
  }

  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      Заказ: {contractStatusLabels[status]}
    </span>
  );
}
