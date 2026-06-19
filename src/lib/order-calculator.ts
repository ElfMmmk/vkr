import type {
  OrderAddonSnapshot,
  OrderRequest,
  ServiceAddon,
  ServicePackage
} from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export type OrderEstimateInput = {
  package: Pick<
    ServicePackage,
    "priceFrom" | "priceTo" | "durationFromDays" | "durationToDays"
  >;
  addons: Array<Pick<ServiceAddon | OrderAddonSnapshot, "price" | "durationDays">>;
};

export type OrderEstimate = {
  priceFrom: number;
  priceTo: number;
  durationFromDays: number;
  durationToDays: number;
};

export type OrderBaseEstimate = {
  priceFrom: number | null;
  priceTo: number | null;
  durationFromDays: number | null;
  durationToDays: number | null;
};

export function calculateOrderEstimate(input: OrderEstimateInput): OrderEstimate {
  const addonPrice = input.addons.reduce((sum, addon) => sum + addon.price, 0);
  const addonDuration = input.addons.reduce((sum, addon) => sum + addon.durationDays, 0);

  return {
    priceFrom: input.package.priceFrom + addonPrice,
    priceTo: input.package.priceTo + addonPrice,
    durationFromDays: input.package.durationFromDays + addonDuration,
    durationToDays: input.package.durationToDays + addonDuration
  };
}

export function getOrderAddonTotals(
  addons: Array<Pick<OrderAddonSnapshot, "price" | "durationDays">>
): { price: number; durationDays: number } {
  return addons.reduce(
    (totals, addon) => ({
      price: totals.price + addon.price,
      durationDays: totals.durationDays + addon.durationDays
    }),
    { price: 0, durationDays: 0 }
  );
}

export function getOrderBaseEstimate(
  request: Pick<
    OrderRequest,
    | "packagePriceFrom"
    | "packagePriceTo"
    | "packageDurationFromDays"
    | "packageDurationToDays"
  >
): OrderBaseEstimate {
  return {
    priceFrom: request.packagePriceFrom,
    priceTo: request.packagePriceTo,
    durationFromDays: request.packageDurationFromDays,
    durationToDays: request.packageDurationToDays
  };
}

export function formatRubles(value: number, locale: Locale = "ru"): string {
  if (locale === "en") {
    return `RUB ${new Intl.NumberFormat("en-US").format(value)}`;
  }

  return `${new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ")} ₽`;
}

export function formatPriceRange(
  priceFrom: number | null,
  priceTo: number | null,
  locale: Locale = "ru"
): string {
  if (typeof priceFrom !== "number" || typeof priceTo !== "number") {
    return locale === "en" ? "Price to be confirmed" : "Стоимость уточняется";
  }

  if (priceFrom === priceTo) {
    return formatRubles(priceFrom, locale);
  }

  return `${formatRubles(priceFrom, locale)} – ${formatRubles(priceTo, locale)}`;
}

export function formatDurationRange(
  durationFromDays: number | null,
  durationToDays: number | null,
  locale: Locale = "ru"
): string {
  if (typeof durationFromDays !== "number" || typeof durationToDays !== "number") {
    return locale === "en" ? "Timing to be confirmed" : "Срок уточняется";
  }

  if (durationFromDays === durationToDays) {
    return locale === "en"
      ? `${durationFromDays} business ${durationFromDays === 1 ? "day" : "days"}`
      : `${durationFromDays} раб. дн.`;
  }

  return locale === "en"
    ? `${durationFromDays} – ${durationToDays} business days`
    : `${durationFromDays} – ${durationToDays} раб. дн.`;
}
