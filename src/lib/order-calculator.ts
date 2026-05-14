import type { OrderAddonSnapshot, ServiceAddon, ServicePackage } from "@/lib/types";

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

export function formatRubles(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function formatPriceRange(priceFrom: number | null, priceTo: number | null): string {
  if (typeof priceFrom !== "number" || typeof priceTo !== "number") {
    return "Стоимость уточняется";
  }

  if (priceFrom === priceTo) {
    return formatRubles(priceFrom);
  }

  return `${formatRubles(priceFrom)}–${formatRubles(priceTo)}`;
}

export function formatDurationRange(
  durationFromDays: number | null,
  durationToDays: number | null
): string {
  if (typeof durationFromDays !== "number" || typeof durationToDays !== "number") {
    return "Срок уточняется";
  }

  if (durationFromDays === durationToDays) {
    return `${durationFromDays} раб. дн.`;
  }

  return `${durationFromDays}–${durationToDays} раб. дн.`;
}
