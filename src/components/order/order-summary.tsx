import type { OrderEstimate } from "@/lib/order-calculator";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";

type OrderSummaryProps = {
  addonTitles: string[];
  estimate: OrderEstimate | null;
  packageTitle: string;
  serviceTitle: string;
  onOpenReview?: () => void;
};

export function OrderSummaryAside({
  addonTitles,
  estimate,
  packageTitle,
  serviceTitle
}: OrderSummaryProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 border border-cobalt/25 bg-cobalt/10 p-5">
        <h2 className="text-xl font-semibold text-ink">Сводка заказа</h2>
        <dl className="mt-4 grid gap-3 text-sm leading-6">
          <div>
            <dt className="font-semibold text-ink">Услуга</dt>
            <dd>{serviceTitle || "Не выбрана"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Пакет</dt>
            <dd>{packageTitle || "Не выбран"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Доплаты</dt>
            <dd>{addonTitles.length ? addonTitles.join(", ") : "Без доплат"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Стоимость</dt>
            <dd>{estimate ? formatPriceRange(estimate.priceFrom, estimate.priceTo) : "Уточняется"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Срок</dt>
            <dd>
              {estimate ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays) : "Уточняется"}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

export function MobileOrderSummary({
  estimate,
  onOpenReview,
  serviceTitle
}: OrderSummaryProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cobalt/20 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(17,24,39,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold text-ink">{serviceTitle || "Услуга не выбрана"}</p>
          <p className="truncate text-muted">
            {estimate
              ? `${formatPriceRange(estimate.priceFrom, estimate.priceTo)} · ${formatDurationRange(
                  estimate.durationFromDays,
                  estimate.durationToDays
                )}`
              : "Расчёт уточняется"}
          </p>
        </div>
        <button
          className="focus-ring shrink-0 border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
          onClick={onOpenReview}
          type="button"
        >
          Сводка
        </button>
      </div>
    </div>
  );
}
