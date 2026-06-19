import Image from "next/image";
import Link from "next/link";

import { FieldError } from "@/components/order/form-parts";
import { formatRubles } from "@/lib/order-calculator";
import type { Locale } from "@/lib/i18n";
import type { Project, ServiceAddon } from "@/lib/types";

type FieldErrors = Record<string, string[]> | undefined;

type ExtrasStepProps = {
  fieldErrors: FieldErrors;
  locale: Locale;
  onSelectReferenceProject: (projectId: string) => void;
  onToggleAddon: (addonId: string) => void;
  referenceProjectId: string;
  selectedAddonIds: string[];
  serviceAddons: ServiceAddon[];
  serviceExamples: Project[];
};

export function ExtrasStep({
  fieldErrors,
  locale,
  onSelectReferenceProject,
  onToggleAddon,
  referenceProjectId,
  selectedAddonIds,
  serviceAddons,
  serviceExamples
}: ExtrasStepProps) {
  return (
    <div className="grid gap-6">
      {serviceAddons.length ? (
        <section className="border border-line bg-white p-5">
          <h3 className="text-xl font-semibold">{locale === "en" ? "Add-ons" : "Дополнительные услуги"}</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {serviceAddons.map((addon) => (
              <label
                className={`flex min-w-0 cursor-pointer gap-3 overflow-hidden border p-4 transition hover:border-ink ${
                  selectedAddonIds.includes(addon.id)
                    ? "border-cobalt bg-cobalt/10"
                    : "border-line bg-white"
                }`}
                key={addon.id}
              >
                <input
                  checked={selectedAddonIds.includes(addon.id)}
                  className="mt-1"
                  name="addonIds"
                  onChange={() => onToggleAddon(addon.id)}
                  type="checkbox"
                  value={addon.id}
                />
                <span className="min-w-0 break-words">
                  <span className="block break-words font-semibold">{addon.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {addon.description}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-cobalt">
                    +{formatRubles(addon.price, locale)}
                    {addon.durationDays
                      ? locale === "en"
                        ? ` · +${addon.durationDays} business days`
                        : ` · +${addon.durationDays} раб. дн.`
                      : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={fieldErrors?.addonIds} />
        </section>
      ) : (
        <p className="border border-line bg-paper p-4 text-sm leading-6 text-muted">
          {locale === "en"
            ? "This service has no optional add-ons. You can continue."
            : "Для этой услуги нет дополнительных опций. Можно перейти дальше."}
        </p>
      )}

      {serviceExamples.length ? (
        <section className="border border-line bg-paper p-5">
          <h3 className="text-xl font-semibold">{locale === "en" ? "Portfolio reference" : "Проект из портфолио"}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {locale === "en"
              ? "Choose a project if its visual direction is close to what you need. It is a reference, not a request to copy the work."
              : "Если вам близка подача одного из проектов, отметьте его как визуальный ориентир. Он поможет понять желаемое направление, но не предполагает точного повторения работы."}
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {serviceExamples.map((project) => (
              <article
                className={`min-w-0 overflow-hidden border bg-white transition ${
                  referenceProjectId === project.id ? "border-cobalt" : "border-line"
                }`}
                key={project.id}
              >
                <label className="block cursor-pointer">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-line">
                    {project.coverImageUrl ? (
                      <Image
                        alt={project.title}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 18vw, (min-width: 768px) 30vw, 100vw"
                        src={project.coverImageUrl}
                      />
                    ) : (
                      <span className="grid h-full place-items-center px-4 text-center text-sm text-muted">
                        {locale === "en" ? "Cover not added yet" : "Обложка пока не добавлена"}
                      </span>
                    )}
                  </span>
                  <span className="flex gap-3 p-4">
                    <input
                      checked={referenceProjectId === project.id}
                      className="mt-1"
                      name="referenceProjectId"
                      onChange={() => onSelectReferenceProject(project.id)}
                      type="radio"
                      value={project.id}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold">{project.title}</span>
                      <span className="mt-1 line-clamp-3 block text-sm leading-6 text-muted">
                        {project.shortDescription}
                      </span>
                    </span>
                  </span>
                </label>
                <Link
                  className="focus-ring mx-4 mb-4 inline-flex text-sm font-semibold text-accent transition hover:text-ink active:translate-y-px"
                  href={`/portfolio/${project.slug}`}
                >
                  {locale === "en" ? "Open project" : "Открыть проект"}
                </Link>
              </article>
            ))}
            <label className="flex cursor-pointer gap-3 border border-line bg-white p-4 lg:col-span-3">
              <input
                checked={!referenceProjectId}
                className="mt-1"
                name="referenceProjectId"
                onChange={() => onSelectReferenceProject("")}
                type="radio"
                value=""
              />
              <span className="text-sm font-semibold text-muted">
                {locale === "en" ? "No reference project" : "Не выбирать проект"}
              </span>
            </label>
          </div>
          <FieldError errors={fieldErrors?.referenceProjectId} />
        </section>
      ) : null}
    </div>
  );
}
