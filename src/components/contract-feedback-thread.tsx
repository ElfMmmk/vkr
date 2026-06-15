import { contractFeedbackRoleLabels } from "@/lib/contract-status";
import type { OrderContractFeedback } from "@/lib/types";

export function ContractFeedbackThread({
  feedback,
  viewer
}: {
  feedback: OrderContractFeedback[];
  viewer: "client" | "staff";
}) {
  if (!feedback.length) {
    return null;
  }

  return (
    <section className="mt-6 border-t border-line pt-5">
      <h3 className="text-lg font-semibold">Комментарии к заказу</h3>
      <ol className="mt-4 grid gap-3">
        {feedback.map((item) => {
          const isClient = item.authorRole === "client";
          const isOwnSide = viewer === "client" ? isClient : !isClient;

          return (
            <li
              className={`max-w-[85%] border p-3 text-sm leading-6 ${
                isOwnSide
                  ? "ml-auto border-cobalt/25 bg-cobalt/10"
                  : "mr-auto border-line bg-white"
              }`}
              key={item.id}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {contractFeedbackRoleLabels[item.authorRole]}
              </p>
              <p className="mt-2">{item.message}</p>
              <time className="mt-2 block text-xs text-muted" dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
