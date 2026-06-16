import {
  formatDurationRange,
  formatPriceRange,
  formatRubles,
  getOrderAddonTotals,
  getOrderBaseEstimate
} from "@/lib/order-calculator";
import type { OrderRequest } from "@/lib/types";

export function OrderEstimateBreakdown({
  request,
  compact = false,
  fixedTerms
}: {
  request: OrderRequest;
  compact?: boolean;
  fixedTerms?: {
    finalPrice: number;
    finalDurationDays: number;
  };
}) {
  const base = getOrderBaseEstimate(request);
  const addons = getOrderAddonTotals(request.selectedAddons);

  if (compact) {
    return (
      <span>
        {fixedTerms
          ? formatRubles(fixedTerms.finalPrice)
          : formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo)}
        {!fixedTerms && addons.price ? ` (дополнительные услуги +${formatRubles(addons.price)})` : ""}
        {" · "}
        {fixedTerms
          ? `${fixedTerms.finalDurationDays} раб. дн.`
          : formatDurationRange(
              request.estimatedDurationFromDays,
              request.estimatedDurationToDays
            )}
        {!fixedTerms && addons.durationDays ? ` (доп. срок +${addons.durationDays} раб. дн.)` : ""}
      </span>
    );
  }

  return (
    <dl className="grid gap-3 text-sm leading-6">
      <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
        <dt className="font-semibold text-muted">Базовый пакет</dt>
        <dd>
          {formatPriceRange(base.priceFrom, base.priceTo)} ·{" "}
          {formatDurationRange(base.durationFromDays, base.durationToDays)}
        </dd>
      </div>
      {request.selectedAddons.length ? (
        <div className="grid gap-1 sm:grid-cols-[220px_1fr]">
          <dt className="font-semibold text-muted">Дополнительные услуги</dt>
          <dd>
            +{formatRubles(addons.price)}
            {addons.durationDays ? ` · +${addons.durationDays} раб. дн.` : ""}
          </dd>
        </div>
      ) : null}
      <div className="grid gap-1 border-t border-line pt-3 sm:grid-cols-[220px_1fr]">
        <dt className="font-semibold">{fixedTerms ? "Стоимость и срок" : "Предварительно"}</dt>
        <dd className="font-semibold">
          {fixedTerms
            ? `${formatRubles(fixedTerms.finalPrice)} · ${fixedTerms.finalDurationDays} раб. дн.`
            : `${formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo)} · ${formatDurationRange(
                request.estimatedDurationFromDays,
                request.estimatedDurationToDays
              )}`}
        </dd>
      </div>
    </dl>
  );
}
