"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { submitOrderAction, type OrderFormState } from "@/app/order/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import { fieldLimits } from "@/lib/field-limits";
import {
  calculateOrderEstimate,
  formatDurationRange,
  formatPriceRange,
  formatRubles
} from "@/lib/order-calculator";
import type { Project, Service } from "@/lib/types";

const contactPlaceholders: Record<string, string> = {
  Telegram: "@username",
  Email: "name@example.com",
  Телефон: "+7 999 000-00-00",
  "Другой способ": "Напишите удобный способ связи"
};

function invalidClass(hasError: boolean) {
  return hasError ? " border-accent bg-accent/5 focus-visible:border-accent" : "";
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-2 text-sm text-accent">{errors[0]}</p>;
}

export function OrderForm({
  projects,
  services,
  selectedServiceSlug
}: {
  projects: Project[];
  services: Service[];
  selectedServiceSlug?: string;
}) {
  const initialState: OrderFormState = {};
  const initialService = services.find((service) => service.slug === selectedServiceSlug) ?? services[0];
  const initialPackage = initialService?.packages.find((item) => item.isActive) ?? initialService?.packages[0];
  const [state, formAction] = useActionState(submitOrderAction, initialState);
  const formStartedAtRef = useRef<HTMLInputElement>(null);
  const [clientName, setClientName] = useState("");
  const [contactMethod, setContactMethod] = useState("Telegram");
  const [contactValue, setContactValue] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id ?? "");
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackage?.id ?? "");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [referenceProjectId, setReferenceProjectId] = useState("");
  const [resultDescription, setResultDescription] = useState("");
  const [stylePreferences, setStylePreferences] = useState("");
  const [materials, setMaterials] = useState("");
  const [desiredDeadline, setDesiredDeadline] = useState("");
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? services[0];
  const servicePackages = selectedService?.packages.filter((item) => item.isActive) ?? [];
  const serviceAddons = selectedService?.addons.filter((item) => item.isActive) ?? [];
  const selectedPackage =
    servicePackages.find((item) => item.id === selectedPackageId) ?? servicePackages[0];
  const selectedAddons = serviceAddons.filter((addon) => selectedAddonIds.includes(addon.id));
  const canSubmitOrder = Boolean(selectedPackage);
  const estimate = selectedPackage
    ? calculateOrderEstimate({ package: selectedPackage, addons: selectedAddons })
    : null;
  const serviceExamples = useMemo(() => {
    if (!selectedService) {
      return [];
    }

    return projects
      .filter((project) =>
        project.services.some(
          (service) => service.id === selectedService.id || service.slug === selectedService.slug
        )
      )
      .slice(0, 3);
  }, [projects, selectedService]);

  useEffect(() => {
    if (formStartedAtRef.current) {
      formStartedAtRef.current.value = String(Date.now());
    }
  }, []);

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((item) => item !== addonId)
        : [...current, addonId]
    );
  }

  if (!services.length) {
    return (
      <div className="border border-line bg-paper p-5 text-sm leading-6 text-muted">
        Сейчас нет активных услуг для оформления заказа.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.tagName !== "TEXTAREA") {
          event.preventDefault();
        }
      }}
    >
      <input name="formStartedAt" ref={formStartedAtRef} type="hidden" />
      <input name="serviceTitle" type="hidden" value={selectedService?.title ?? ""} />
      <label className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        Website
        <input autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Имя" required>
          <LimitedInput
            aria-invalid={Boolean(state.fieldErrors?.clientName) || undefined}
            className={`${inputClass}${invalidClass(Boolean(state.fieldErrors?.clientName))}`}
            maxLength={fieldLimits.order.clientName.max}
            name="clientName"
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Как к вам обращаться"
            required
            value={clientName}
          />
          <FieldError errors={state.fieldErrors?.clientName} />
        </Field>
        <Field label="Услуга" required>
          <select
            className={`${selectClass}${invalidClass(Boolean(state.fieldErrors?.serviceId))}`}
            name="serviceId"
            onChange={(event) => {
              const nextServiceId = event.target.value;
              const nextService = services.find((service) => service.id === nextServiceId);
              const nextPackage = nextService?.packages.find((item) => item.isActive) ?? nextService?.packages[0];

              setSelectedServiceId(nextServiceId);
              setSelectedPackageId(nextPackage?.id ?? "");
              setSelectedAddonIds([]);
              setReferenceProjectId("");
            }}
            required
            value={selectedServiceId}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.serviceId} />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Способ связи" required>
          <select
            className={`${selectClass}${invalidClass(Boolean(state.fieldErrors?.contactMethod))}`}
            name="contactMethod"
            onChange={(event) => {
              setContactMethod(event.target.value);
              setContactValue("");
            }}
            required
            value={contactMethod}
          >
            <option>Telegram</option>
            <option>Email</option>
            <option>Телефон</option>
            <option>Другой способ</option>
          </select>
          <FieldError errors={state.fieldErrors?.contactMethod} />
        </Field>
        <Field label="Контакт" required>
          <LimitedInput
            aria-invalid={Boolean(state.fieldErrors?.contactValue) || undefined}
            className={`${inputClass}${invalidClass(Boolean(state.fieldErrors?.contactValue))}`}
            maxLength={fieldLimits.order.contactValue.max}
            name="contactValue"
            onChange={(event) => setContactValue(event.target.value)}
            placeholder={contactPlaceholders[contactMethod]}
            required
            type={contactMethod === "Email" ? "email" : "text"}
            value={contactValue}
          />
          <FieldError errors={state.fieldErrors?.contactValue} />
        </Field>
      </div>

      <section className="border border-line bg-paper p-5">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <h2 className="text-xl font-semibold">Пакет работ</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Пакет задает ориентировочный состав, стоимость и срок.
            </p>
          </div>
          {estimate ? (
            <p className="text-sm font-semibold text-cobalt">
              {formatPriceRange(estimate.priceFrom, estimate.priceTo)} ·{" "}
              {formatDurationRange(estimate.durationFromDays, estimate.durationToDays)}
            </p>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3">
          {servicePackages.map((item) => (
            <label
              className="flex cursor-pointer gap-3 border border-line bg-white p-4 transition hover:border-ink"
              key={item.id}
            >
              <input
                checked={selectedPackageId === item.id}
                className="mt-1"
                name="packageId"
                onChange={() => setSelectedPackageId(item.id)}
                required
                type="radio"
                value={item.id}
              />
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{item.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">{item.description}</span>
                <span className="mt-2 block text-sm font-semibold text-cobalt">
                  {formatPriceRange(item.priceFrom, item.priceTo)} ·{" "}
                  {formatDurationRange(item.durationFromDays, item.durationToDays)}
                </span>
              </span>
            </label>
          ))}
          {!servicePackages.length ? (
            <p className="border border-line bg-white p-4 text-sm leading-6 text-muted">
              По этой услуге пока нельзя оформить заказ: дизайнер уточняет состав работ и ориентиры по стоимости.
              Выберите другую услугу или вернитесь к заказу позже.
            </p>
          ) : null}
        </div>
        <FieldError errors={state.fieldErrors?.packageId} />
      </section>

      {serviceAddons.length ? (
        <section className="border border-line bg-white p-5">
          <h2 className="text-xl font-semibold">Доплаты</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {serviceAddons.map((addon) => (
              <label className="flex cursor-pointer gap-3 border border-line p-4" key={addon.id}>
                <input
                  checked={selectedAddonIds.includes(addon.id)}
                  className="mt-1"
                  name="addonIds"
                  onChange={() => toggleAddon(addon.id)}
                  type="checkbox"
                  value={addon.id}
                />
                <span>
                  <span className="block font-semibold">{addon.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{addon.description}</span>
                  <span className="mt-2 block text-sm font-semibold text-cobalt">
                    +{formatRubles(addon.price)}
                    {addon.durationDays ? ` · +${addon.durationDays} раб. дн.` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={state.fieldErrors?.addonIds} />
        </section>
      ) : null}

      {serviceExamples.length ? (
        <section className="border border-line bg-paper p-5">
          <h2 className="text-xl font-semibold">Пример работы для ориентира</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {serviceExamples.map((project) => (
              <article
                className={`border bg-white transition ${
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
                        Обложка пока не добавлена
                      </span>
                    )}
                  </span>
                  <span className="flex gap-3 p-4">
                    <input
                      checked={referenceProjectId === project.id}
                      className="mt-1"
                      name="referenceProjectId"
                      onChange={() => setReferenceProjectId(project.id)}
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
                  Открыть проект
                </Link>
              </article>
            ))}
            <label className="flex cursor-pointer gap-3 border border-line bg-white p-4 lg:col-span-3">
              <input
                checked={!referenceProjectId}
                className="mt-1"
                name="referenceProjectId"
                onChange={() => setReferenceProjectId("")}
                type="radio"
                value=""
              />
              <span className="text-sm font-semibold text-muted">Без конкретного примера</span>
            </label>
          </div>
          <FieldError errors={state.fieldErrors?.referenceProjectId} />
        </section>
      ) : null}

      <Field label="Ожидаемый результат" required>
        <LimitedTextarea
          aria-invalid={Boolean(state.fieldErrors?.resultDescription) || undefined}
          className={`${textareaClass}${invalidClass(Boolean(state.fieldErrors?.resultDescription))}`}
          maxLength={fieldLimits.order.resultDescription.max}
          minLength={fieldLimits.order.resultDescription.min}
          name="resultDescription"
          onChange={(event) => setResultDescription(event.target.value)}
          placeholder="Что должно быть сделано: логотип, презентация, упаковка, шаблоны, носители"
          required
          value={resultDescription}
        />
        <FieldError errors={state.fieldErrors?.resultDescription} />
      </Field>

      <Field label="Стиль и ориентиры" required>
        <LimitedTextarea
          aria-invalid={Boolean(state.fieldErrors?.stylePreferences) || undefined}
          className={`${textareaClass}${invalidClass(Boolean(state.fieldErrors?.stylePreferences))}`}
          maxLength={fieldLimits.order.stylePreferences.max}
          minLength={fieldLimits.order.stylePreferences.min}
          name="stylePreferences"
          onChange={(event) => setStylePreferences(event.target.value)}
          placeholder="Например: минималистично, ярко, премиально, похоже на выбранный пример"
          required
          value={stylePreferences}
        />
        <FieldError errors={state.fieldErrors?.stylePreferences} />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Материалы">
          <LimitedTextarea
            className={textareaClass}
            maxLength={fieldLimits.order.materials.max}
            name="materials"
            onChange={(event) => setMaterials(event.target.value)}
            placeholder="Что уже есть: тексты, логотип, фото, брендбук, размеры"
            value={materials}
          />
        </Field>
        <Field label="Желаемый срок">
          <LimitedInput
            className={inputClass}
            maxLength={fieldLimits.order.desiredDeadline.max}
            name="desiredDeadline"
            onChange={(event) => setDesiredDeadline(event.target.value)}
            placeholder="Например: до 20 июня или к запуску"
            value={desiredDeadline}
          />
        </Field>
      </div>

      <aside className="border border-cobalt/25 bg-cobalt/10 p-5">
        <h2 className="text-xl font-semibold text-ink">Сводка заказа</h2>
        <dl className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink">Услуга</dt>
            <dd>{selectedService?.title ?? "Не выбрана"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Пакет</dt>
            <dd>{selectedPackage?.title ?? "Не выбран"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Предварительная стоимость</dt>
            <dd>{estimate ? formatPriceRange(estimate.priceFrom, estimate.priceTo) : "Уточняется"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Предварительный срок</dt>
            <dd>
              {estimate
                ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays)
                : "Уточняется"}
            </dd>
          </div>
        </dl>
      </aside>

      {state.message ? (
        <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
          {state.message}
        </div>
      ) : null}
      {!canSubmitOrder ? (
        <div className="border border-line bg-paper px-4 py-3 text-sm leading-6 text-muted">
          Отправка заказа будет доступна после выбора услуги с настроенным пакетом работ.
        </div>
      ) : null}
      <FormSubmitButton
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 md:w-auto"
        disabled={!canSubmitOrder}
        idleLabel="Отправить заказ"
        pendingLabel="Отправка..."
      />
    </form>
  );
}
