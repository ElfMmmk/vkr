import { FieldError } from "@/components/order/form-parts";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";
import type { Locale } from "@/lib/i18n";
import type { ServicePackage } from "@/lib/types";

type PackageStepProps = {
  packages: ServicePackage[];
  locale: Locale;
  selectedPackageId: string;
  errors?: string[];
  onSelectPackage: (packageId: string) => void;
};

export function PackageStep({
  errors,
  locale,
  onSelectPackage,
  packages,
  selectedPackageId
}: PackageStepProps) {
  const recommendedPackageId =
    packages.find((item) => item.isRecommended)?.id ?? packages[0]?.id ?? "";

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {packages.map((item) => {
        const isSelected = selectedPackageId === item.id;
        const isRecommended = recommendedPackageId === item.id;
        const hasMarketing = Boolean(item.bestFor || item.outcome || item.includedItems.length);

        return (
          <label
            className={`flex min-w-0 cursor-pointer gap-3 overflow-hidden border p-4 transition hover:border-ink ${
              isSelected ? "border-cobalt bg-cobalt/10" : "border-line bg-white"
            }`}
            key={item.id}
          >
            <input
              checked={isSelected}
              className="mt-1"
              name="packageId"
              onChange={() => onSelectPackage(item.id)}
              required
              type="radio"
              value={item.id}
            />
            <span className="min-w-0 break-words">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{item.title}</span>
                {item.badge ? (
                  <span className="border border-line bg-paper px-2 py-1 text-xs font-semibold text-ink">
                    {item.badge}
                  </span>
                ) : null}
                {isRecommended ? (
                  <span className="border border-cobalt/25 bg-white px-2 py-1 text-xs font-semibold text-cobalt">
                    {locale === "en" ? "Best match" : "Оптимальный выбор"}
                  </span>
                ) : null}
              </span>
              <span className={`mt-1 block text-sm leading-6 ${isSelected ? "text-ink" : "text-muted"}`}>
                {item.description}
              </span>
              {hasMarketing ? (
                <span className="mt-3 grid gap-2 text-sm leading-6 text-ink">
                  {item.bestFor ? <span>{locale === "en" ? "Best for" : "Подойдёт"}: {item.bestFor}</span> : null}
                  {item.outcome ? <span>{locale === "en" ? "Outcome" : "Результат"}: {item.outcome}</span> : null}
                  {item.includedItems.length ? (
                    <span className="grid gap-1">
                      <span className="font-semibold">{locale === "en" ? "Includes:" : "Входит:"}</span>
                      <span className="flex flex-wrap gap-2">
                        {item.includedItems.map((includedItem) => (
                          <span
                            className="border border-line bg-white px-2 py-1 text-xs font-semibold text-muted"
                            key={includedItem}
                          >
                            {includedItem}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="mt-2 block text-sm leading-6 text-ink">
                  {locale === "en"
                    ? "A clear scope and preliminary range before the detailed discussion."
                    : "Подойдёт, если нужен понятный состав работ и предварительный диапазон до обсуждения деталей."}
                </span>
              )}
              <span className="mt-2 block text-sm font-semibold text-cobalt">
                {formatPriceRange(item.priceFrom, item.priceTo, locale)} ·{" "}
                {formatDurationRange(item.durationFromDays, item.durationToDays, locale)}
              </span>
            </span>
          </label>
        );
      })}
      {!packages.length ? (
        <p className="border border-line bg-white p-4 text-sm leading-6 text-muted xl:col-span-3">
          {locale === "en"
            ? "This service is not available for online ordering yet. Choose another service or return later."
            : "По этой услуге пока нельзя оформить заказ: дизайнер уточняет состав работ и ориентиры по стоимости. Выберите другую услугу или вернитесь к заказу позже."}
        </p>
      ) : null}
      <div className="xl:col-span-3">
        <FieldError errors={errors} />
      </div>
    </div>
  );
}
