import type { OrderEstimate } from "@/lib/order-calculator";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";
import type { Locale } from "@/lib/i18n";

type OrderSummaryProps = {
  addonTitles: string[];
  estimate: OrderEstimate | null;
  locale: Locale;
  packageTitle: string;
  serviceTitle: string;
};

function SummaryContent({
  addonTitles,
  estimate,
  locale,
  packageTitle,
  serviceTitle
}: OrderSummaryProps) {
  return (
    <dl className="grid gap-3 break-words text-sm leading-6">
      <div>
        <dt className="font-semibold text-ink">{locale === "en" ? "Service" : "Услуга"}</dt>
        <dd>{serviceTitle || (locale === "en" ? "Not selected" : "Не выбрана")}</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">{locale === "en" ? "Package" : "Пакет"}</dt>
        <dd>{packageTitle || (locale === "en" ? "Not selected" : "Не выбран")}</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">{locale === "en" ? "Add-ons" : "Дополнения"}</dt>
        <dd>{addonTitles.length ? addonTitles.join(", ") : locale === "en" ? "No add-ons" : "Без дополнений"}</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">{locale === "en" ? "Price" : "Стоимость"}</dt>
        <dd>{estimate ? formatPriceRange(estimate.priceFrom, estimate.priceTo, locale) : locale === "en" ? "To be confirmed" : "Уточняется"}</dd>
      </div>
      <div>
        <dt className="font-semibold text-ink">{locale === "en" ? "Timing" : "Срок"}</dt>
        <dd>
          {estimate ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays, locale) : locale === "en" ? "To be confirmed" : "Уточняется"}
        </dd>
      </div>
    </dl>
  );
}

export function OrderSummaryAside(props: OrderSummaryProps) {
  return (
    <aside className="hidden min-w-0 lg:block">
      <div className="sticky top-24 overflow-hidden border border-cobalt/25 bg-cobalt/10 p-5">
        <h2 className="text-xl font-semibold text-ink">{props.locale === "en" ? "Order summary" : "Сводка заказа"}</h2>
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
        {props.locale === "en" ? "Order summary" : "Сводка заказа"}
      </summary>
      <div className="border-t border-cobalt/20 px-4 py-4">
        <SummaryContent {...props} />
      </div>
    </details>
  );
}
