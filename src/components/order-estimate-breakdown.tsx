import {
  formatDurationRange,
  formatPriceRange,
  formatRubles,
  getOrderAddonTotals,
  getOrderBaseEstimate
} from "@/lib/order-calculator";
import type { Locale } from "@/lib/i18n";
import type { OrderRequest } from "@/lib/types";

export function OrderEstimateBreakdown({
  request,
  compact = false,
  fixedTerms,
  locale = "ru"
}: {
  request: OrderRequest;
  compact?: boolean;
  fixedTerms?: {
    finalPrice: number;
    finalDurationDays: number;
  };
  locale?: Locale;
}) {
  const base = getOrderBaseEstimate(request);
  const addons = getOrderAddonTotals(request.selectedAddons);

  if (compact) {
    return (
      <span>
        {fixedTerms
          ? formatRubles(fixedTerms.finalPrice, locale)
          : formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo, locale)}
        {!fixedTerms && addons.price
          ? ` (${locale === "en" ? "add-ons" : "дополнительные услуги"} +${formatRubles(addons.price, locale)})`
          : ""}
        {" · "}
        {fixedTerms
          ? formatDurationRange(
              fixedTerms.finalDurationDays,
              fixedTerms.finalDurationDays,
              locale
            )
          : formatDurationRange(
              request.estimatedDurationFromDays,
              request.estimatedDurationToDays,
              locale
            )}
        {!fixedTerms && addons.durationDays
          ? ` (${locale === "en" ? "extra time" : "доп. срок"} +${formatDurationRange(
              addons.durationDays,
              addons.durationDays,
              locale
            )})`
          : ""}
      </span>
    );
  }

  return (
    <dl className="grid gap-3 text-sm leading-6">
      <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
        <dt className="font-semibold text-muted">
          {locale === "en" ? "Base package" : "Базовый пакет"}
        </dt>
        <dd>
          {formatPriceRange(base.priceFrom, base.priceTo, locale)} ·{" "}
          {formatDurationRange(base.durationFromDays, base.durationToDays, locale)}
        </dd>
      </div>
      {request.selectedAddons.length ? (
        <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
          <dt className="font-semibold text-muted">
            {locale === "en" ? "Add-ons" : "Дополнительные услуги"}
          </dt>
          <dd>
            +{formatRubles(addons.price, locale)}
            {addons.durationDays
              ? ` · +${formatDurationRange(addons.durationDays, addons.durationDays, locale)}`
              : ""}
          </dd>
        </div>
      ) : null}
      <div className="grid gap-1 border-t border-line pt-3 sm:grid-cols-[220px_1fr]">
        <dt className="font-semibold">
          {fixedTerms
            ? locale === "en"
              ? "Price and timing"
              : "Стоимость и срок"
            : locale === "en"
              ? "Estimate"
              : "Предварительно"}
        </dt>
        <dd className="font-semibold">
          {fixedTerms
            ? `${formatRubles(fixedTerms.finalPrice, locale)} · ${formatDurationRange(
                fixedTerms.finalDurationDays,
                fixedTerms.finalDurationDays,
                locale
              )}`
            : `${formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo, locale)} · ${formatDurationRange(
                request.estimatedDurationFromDays,
                request.estimatedDurationToDays,
                locale
              )}`}
        </dd>
      </div>
    </dl>
  );
}
