import { requestStatusLabels } from "@/lib/request-status";
import type { RequestStatus } from "@/lib/types";

const styles: Record<RequestStatus, string> = {
  new: "border-cobalt/30 bg-cobalt/10 text-cobalt",
  in_progress: "border-amber-500/30 bg-amber-100 text-amber-800",
  approved: "border-emerald-500/30 bg-emerald-100 text-emerald-800",
  in_work: "border-violet-500/30 bg-violet-100 text-violet-800",
  completed: "border-ink/20 bg-ink/10 text-ink",
  rejected: "border-accent/30 bg-accent/10 text-accent"
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {requestStatusLabels[status]}
    </span>
  );
}
