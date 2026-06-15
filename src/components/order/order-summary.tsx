import type { OrderEstimate } from "@/lib/order-calculator";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";

type OrderSummaryProps = {
  addonTitles: string[];
  estimate: OrderEstimate | null;
  packageTitle: string;
  serviceTitle: string;
};

function SummaryContent({
  addonTitles,
  estimate,
  packageTitle,
  serviceTitle
}: OrderSummaryProps) {
  return (
    <dl className="grid gap-3 break-words text-sm leading-6">
      <div>
        <dt className="font-semibold text-ink">Услуга</dt>
        <dd>{serviceTitle || "Не выбрана"}</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Пакет</dt>
        <dd>{packageTitle || "Не выбран"}</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">Дополнения</dt>
        <dd>{addonTitles.length ? addonTitles.join(", ") : "Без дополнений"}</dd>
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
  );
}

export function OrderSummaryAside(props: OrderSummaryProps) {
  return (
    <aside className="hidden min-w-0 lg:block">
      <div className="sticky top-24 overflow-hidden border border-cobalt/25 bg-cobalt/10 p-5">
        <h2 className="text-xl font-semibold text-ink">Сводка заказа</h2>
        <div className="mt-4">
          <SummaryContent {...props} />
        </div>
      </div>
    </aside>
  );
}

export function MobileOrderSummary(props: OrderSummaryProps) {
  return (
    <details className="border border-cobalt/25 bg-cobalt/10 lg:hidden">
      <summary className="focus-ring cursor-pointer px-4 py-3 text-sm font-semibold text-ink">
        Сводка заказа
      </summary>
      <div className="border-t border-cobalt/20 px-4 py-4">
        <SummaryContent {...props} />
      </div>
    </details>
  );
}
