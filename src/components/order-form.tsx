"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { submitOrderAction, type OrderFormState } from "@/app/order/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import {
  contactPlaceholders,
  materialChips,
  orderSteps as steps,
  quizQuestionOptions,
  resultChips,
  styleChips,
  submitUnlockDelayMs
} from "@/components/order/order-form-config";
import { MobileOrderSummary, OrderSummaryAside } from "@/components/order/order-summary";
import { PackageStep } from "@/components/order/package-step";
import { StepNavigation } from "@/components/order/step-navigation";
import { fieldLimits } from "@/lib/field-limits";
import {
  ORDER_DRAFT_STORAGE_KEY,
  ORDER_DRAFT_VERSION,
  appendBriefChip,
  parseOrderDraft,
  type OrderStepId
} from "@/lib/order-draft";
import {
  MAX_ORDER_ATTACHMENT_COUNT,
  validateOrderAttachmentList,
  type OrderAttachmentFileLike
} from "@/lib/order-attachments";
import {
  calculateOrderEstimate,
  formatDurationRange,
  formatPriceRange,
  formatRubles
} from "@/lib/order-calculator";
import {
  quizAnswersToBrief,
  recommendOrderSetup,
  type OrderQuizAnswers
} from "@/lib/order-quiz";
import type { Project, Service } from "@/lib/types";

function invalidClass(hasError: boolean) {
  return hasError ? " border-accent bg-accent/5 focus-visible:border-accent" : "";
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-2 text-sm text-accent">{errors[0]}</p>;
}

function StepPanel({
  active,
  children,
  id
}: {
  active: boolean;
  children: React.ReactNode;
  id: OrderStepId;
}) {
  return (
    <section aria-labelledby={`order-step-${id}`} hidden={!active}>
      {children}
    </section>
  );
}

function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} КБ`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

function fileListToMetadata(fileList: FileList | null): OrderAttachmentFileLike[] {
  return Array.from(fileList ?? []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type
  }));
}

function canUseQuizAnswers(answers: Partial<OrderQuizAnswers>): answers is OrderQuizAnswers {
  return Boolean(answers.taskType && answers.goal && answers.urgency && answers.materials && answers.scope);
}

function getDefaultPackage(service: Service | undefined) {
  const activePackages = service?.packages.filter((item) => item.isActive) ?? [];

  return activePackages.find((item) => item.isRecommended) ?? activePackages[0] ?? service?.packages[0];
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
  const initialPackage = getDefaultPackage(initialService);
  const [state, formAction] = useActionState(submitOrderAction, initialState);
  const formStartedAtRef = useRef<HTMLInputElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitDelayActive, setIsSubmitDelayActive] = useState(true);
  const [submitDelaySeconds, setSubmitDelaySeconds] = useState(Math.ceil(submitUnlockDelayMs / 1000));
  const [activeStepId, setActiveStepId] = useState<OrderStepId>("service");
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
  const [comment, setComment] = useState("");
  const [localStepError, setLocalStepError] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<OrderAttachmentFileLike[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Partial<OrderQuizAnswers>>({});
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? services[0];
  const servicePackages = selectedService?.packages.filter((item) => item.isActive) ?? [];
  const serviceAddons = selectedService?.addons.filter((item) => item.isActive) ?? [];
  const selectedPackage =
    servicePackages.find((item) => item.id === selectedPackageId) ?? servicePackages[0];
  const selectedAddons = serviceAddons.filter((addon) => selectedAddonIds.includes(addon.id));
  const canSubmitOrder = Boolean(selectedPackage) && !attachmentError;
  const activeStepIndex = steps.findIndex((step) => step.id === activeStepId);
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

  function applyService(nextServiceId: string) {
    const nextService = services.find((service) => service.id === nextServiceId);
    const nextPackage = getDefaultPackage(nextService);

    setSelectedServiceId(nextServiceId);
    setSelectedPackageId(nextPackage?.id ?? "");
    setSelectedAddonIds([]);
    setReferenceProjectId("");
  }

  useEffect(() => {
    if (formStartedAtRef.current) {
      formStartedAtRef.current.value = String(Date.now());
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const remainingMs = Math.max(0, submitUnlockDelayMs - (Date.now() - startedAt));

      setSubmitDelaySeconds(Math.ceil(remainingMs / 1000));

      if (remainingMs === 0) {
        setIsSubmitDelayActive(false);
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const draft = parseOrderDraft(window.localStorage.getItem(ORDER_DRAFT_STORAGE_KEY));

    const timeoutId = window.setTimeout(() => {
      if (!draft) {
        setIsHydrated(true);
        return;
      }

      setActiveStepId(draft.stepId);
      setClientName(draft.values.clientName);
      setContactMethod(draft.values.contactMethod || "Telegram");
      setContactValue(draft.values.contactValue);
      setSelectedServiceId(draft.values.serviceId || initialService?.id || "");
      setSelectedPackageId(draft.values.packageId || initialPackage?.id || "");
      setSelectedAddonIds(draft.values.addonIds);
      setReferenceProjectId(draft.values.referenceProjectId);
      setResultDescription(draft.values.resultDescription);
      setStylePreferences(draft.values.stylePreferences);
      setMaterials(draft.values.materials);
      setDesiredDeadline(draft.values.desiredDeadline);
      setComment(draft.values.comment);
      setQuizAnswers((draft.quizAnswers ?? {}) as Partial<OrderQuizAnswers>);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialPackage?.id, initialService?.id]);

  useEffect(() => {
    const restoredValues = state.values;
    if (!restoredValues) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setClientName(restoredValues.clientName);
      setContactMethod(restoredValues.contactMethod || "Telegram");
      setContactValue(restoredValues.contactValue);
      setSelectedServiceId(restoredValues.serviceId || initialService?.id || "");
      setSelectedPackageId(restoredValues.packageId || initialPackage?.id || "");
      setSelectedAddonIds(restoredValues.addonIds);
      setReferenceProjectId(restoredValues.referenceProjectId);
      setResultDescription(restoredValues.resultDescription);
      setStylePreferences(restoredValues.stylePreferences);
      setMaterials(restoredValues.materials);
      setDesiredDeadline(restoredValues.desiredDeadline);
      setComment(restoredValues.comment);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialPackage?.id, initialService?.id, state.values]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify({
        quizAnswers,
        stepId: activeStepId,
        values: {
          addonIds: selectedAddonIds,
          clientName,
          comment,
          contactMethod,
          contactValue,
          desiredDeadline,
          materials,
          packageId: selectedPackageId,
          referenceProjectId,
          resultDescription,
          serviceId: selectedServiceId,
          stylePreferences
        },
        version: ORDER_DRAFT_VERSION
      })
    );
  }, [
    activeStepId,
    clientName,
    comment,
    contactMethod,
    contactValue,
    desiredDeadline,
    isHydrated,
    materials,
    quizAnswers,
    referenceProjectId,
    resultDescription,
    selectedAddonIds,
    selectedPackageId,
    selectedServiceId,
    stylePreferences
  ]);

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((item) => item !== addonId)
        : [...current, addonId]
    );
  }

  function validateCurrentStep(): boolean {
    if (activeStepId === "service" && !selectedServiceId) {
      setLocalStepError("Выберите услугу или пройдите подбор.");
      return false;
    }

    if (activeStepId === "package" && !selectedPackageId) {
      setLocalStepError("Выберите пакет работ.");
      return false;
    }

    if (activeStepId === "brief") {
      if (resultDescription.trim().length < fieldLimits.order.resultDescription.min) {
        setLocalStepError("Опишите ожидаемый результат чуть подробнее.");
        return false;
      }

      if (stylePreferences.trim().length < fieldLimits.order.stylePreferences.min) {
        setLocalStepError("Добавьте стиль или ориентир.");
        return false;
      }
    }

    if (activeStepId === "contact") {
      if (!clientName.trim() || !contactValue.trim()) {
        setLocalStepError("Укажите имя и контакт для связи.");
        return false;
      }

      if (attachmentError) {
        setLocalStepError(attachmentError);
        return false;
      }
    }

    setLocalStepError("");
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) {
      return;
    }

    const nextStep = steps[Math.min(activeStepIndex + 1, steps.length - 1)];

    setActiveStepId(nextStep.id);
  }

  function goBack() {
    setLocalStepError("");
    const previousStep = steps[Math.max(activeStepIndex - 1, 0)];

    setActiveStepId(previousStep.id);
  }

  function applyQuizRecommendation() {
    if (!canUseQuizAnswers(quizAnswers)) {
      setLocalStepError("Ответьте на вопросы подбора.");
      return;
    }

    const recommendation = recommendOrderSetup(quizAnswers, services);

    if (!recommendation) {
      setLocalStepError("Не удалось подобрать услугу. Выберите её вручную.");
      return;
    }

    applyService(recommendation.serviceId);
    setSelectedPackageId(recommendation.packageId);
    setResultDescription((current) => appendBriefChip(current, quizAnswersToBrief(quizAnswers)));
    setIsQuizOpen(false);
    setLocalStepError("");
  }

  function clearDraft() {
    window.localStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    setActiveStepId("service");
    setClientName("");
    setContactMethod("Telegram");
    setContactValue("");
    setSelectedServiceId(initialService?.id ?? "");
    setSelectedPackageId(initialPackage?.id ?? "");
    setSelectedAddonIds([]);
    setReferenceProjectId("");
    setResultDescription("");
    setStylePreferences("");
    setMaterials("");
    setDesiredDeadline("");
    setComment("");
    setQuizAnswers({});
    setLocalStepError("");
  }

  function rememberSubmitSummary() {
    window.sessionStorage.setItem(
      "vkr-last-order-summary",
      JSON.stringify({
        addons: selectedAddons.map((addon) => addon.title),
        duration: estimate ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays) : "",
        files: attachmentFiles.map((file) => file.name),
        packageTitle: selectedPackage?.title ?? "",
        price: estimate ? formatPriceRange(estimate.priceFrom, estimate.priceTo) : "",
        serviceTitle: selectedService?.title ?? ""
      })
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
      className="space-y-6 pb-24 lg:pb-0"
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.tagName !== "TEXTAREA") {
          event.preventDefault();
        }
      }}
      onSubmit={rememberSubmitSummary}
    >
      <input name="formStartedAt" ref={formStartedAtRef} type="hidden" />
      <input name="serviceTitle" type="hidden" value={selectedService?.title ?? ""} />
      <label aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        Website
        <input aria-hidden="true" autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <StepNavigation
            activeStepId={activeStepId}
            activeStepIndex={activeStepIndex}
            onSelectStep={(stepId, stepIndex) => {
              if (stepIndex <= activeStepIndex || validateCurrentStep()) {
                setActiveStepId(stepId);
              }
            }}
            steps={steps}
          />

          <div className="border border-line bg-white p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Шаг {activeStepIndex + 1} из {steps.length}
            </p>
            <h2 className="mt-2 text-2xl font-semibold" id={`order-step-${activeStepId}`}>
              {steps[activeStepIndex].title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">{steps[activeStepIndex].description}</p>
            {localStepError ? (
              <p className="mt-4 border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent" role="alert">
                {localStepError}
              </p>
            ) : null}
          </div>

          <StepPanel active={activeStepId === "service"} id="service">
            <div className="grid gap-5">
              <div className="border border-line bg-paper p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-xl font-semibold">Не знаете, что выбрать?</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Ответьте на пять вопросов, и форма подставит подходящее направление.
                    </p>
                  </div>
                  <button
                    className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
                    onClick={() => setIsQuizOpen((current) => !current)}
                    type="button"
                  >
                    Помочь выбрать
                  </button>
                </div>
                {isQuizOpen ? (
                  <div className="mt-5 grid gap-4">
                    {Object.entries(quizQuestionOptions).map(([key, options]) => (
                      <div key={key}>
                        <p className="text-sm font-semibold text-ink">
                          {key === "taskType"
                            ? "Тип задачи"
                            : key === "goal"
                              ? "Цель"
                              : key === "urgency"
                                ? "Срок"
                                : key === "materials"
                                  ? "Материалы"
                                  : "Объём"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {options.map((option) => (
                            <button
                              className={`focus-ring border px-3 py-2 text-sm font-semibold transition ${
                                quizAnswers[key as keyof OrderQuizAnswers] === option.value
                                  ? "border-cobalt bg-cobalt text-white"
                                  : "border-line bg-white text-ink hover:border-ink"
                              }`}
                              key={option.value}
                              onClick={() =>
                                setQuizAnswers((current) => ({
                                  ...current,
                                  [key]: option.value
                                }))
                              }
                              type="button"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      className="focus-ring inline-flex min-h-11 w-fit items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent"
                      onClick={applyQuizRecommendation}
                      type="button"
                    >
                      Подобрать услугу
                    </button>
                  </div>
                ) : null}
              </div>

              <Field label="Услуга" required>
                <select
                  className={`${selectClass}${invalidClass(Boolean(state.fieldErrors?.serviceId))}`}
                  name="serviceId"
                  onChange={(event) => applyService(event.target.value)}
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
          </StepPanel>

          <StepPanel active={activeStepId === "package"} id="package">
            <PackageStep
              errors={state.fieldErrors?.packageId}
              onSelectPackage={setSelectedPackageId}
              packages={servicePackages}
              selectedPackageId={selectedPackageId}
            />
          </StepPanel>

          <StepPanel active={activeStepId === "extras"} id="extras">
            <div className="grid gap-6">
              {serviceAddons.length ? (
                <section className="border border-line bg-white p-5">
                  <h3 className="text-xl font-semibold">Доплаты</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {serviceAddons.map((addon) => (
                      <label
                        className={`flex cursor-pointer gap-3 border p-4 transition hover:border-ink ${
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
              ) : (
                <p className="border border-line bg-paper p-4 text-sm leading-6 text-muted">
                  Для этой услуги нет дополнительных опций. Можно перейти дальше.
                </p>
              )}

              {serviceExamples.length ? (
                <section className="border border-line bg-paper p-5">
                  <h3 className="text-xl font-semibold">Пример работы для ориентира</h3>
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
            </div>
          </StepPanel>

          <StepPanel active={activeStepId === "brief"} id="brief">
            <div className="grid gap-5">
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {resultChips.map((chip) => (
                    <button
                      className="focus-ring border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-ink"
                      key={chip}
                      onClick={() => setResultDescription((current) => appendBriefChip(current, chip))}
                      type="button"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {styleChips.map((chip) => (
                    <button
                      className="focus-ring border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-ink"
                      key={chip}
                      onClick={() => setStylePreferences((current) => appendBriefChip(current, chip))}
                      type="button"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <FieldError errors={state.fieldErrors?.stylePreferences} />
              </Field>

              <Field label="Материалы">
                <LimitedTextarea
                  className={textareaClass}
                  maxLength={fieldLimits.order.materials.max}
                  name="materials"
                  onChange={(event) => setMaterials(event.target.value)}
                  placeholder="Что уже есть: тексты, логотип, фото, брендбук, размеры"
                  value={materials}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {materialChips.map((chip) => (
                    <button
                      className="focus-ring border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-ink"
                      key={chip}
                      onClick={() => setMaterials((current) => appendBriefChip(current, chip))}
                      type="button"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
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
          </StepPanel>

          <StepPanel active={activeStepId === "contact"} id="contact">
            <div className="grid gap-5">
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
              </div>
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
              <Field label="Материалы к заказу">
                <input
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain"
                  className={inputClass}
                  multiple
                  name="attachments"
                  onChange={(event) => {
                    const files = fileListToMetadata(event.target.files);
                    setAttachmentFiles(files);
                    setAttachmentError(validateOrderAttachmentList(files) ?? "");
                  }}
                  type="file"
                />
                <p className="mt-2 text-sm leading-6 text-muted">
                  До {MAX_ORDER_ATTACHMENT_COUNT} файлов: PDF, DOC, DOCX, TXT, JPEG, PNG или WebP, до 10 МБ каждый.
                </p>
                {attachmentFiles.length ? (
                  <ul className="mt-3 grid gap-2 text-sm text-muted">
                    {attachmentFiles.map((file) => (
                      <li key={`${file.name}-${file.size}`}>
                        {file.name} · {formatBytes(file.size)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {attachmentError ? <p className="mt-2 text-sm text-accent">{attachmentError}</p> : null}
              </Field>
            </div>
          </StepPanel>

          <StepPanel active={activeStepId === "review"} id="review">
            <div className="grid gap-5">
              <div className="border border-cobalt/25 bg-cobalt/10 p-5">
                <h3 className="text-xl font-semibold text-ink">Проверьте заказ</h3>
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
                    <dd>{estimate ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays) : "Уточняется"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Контакт</dt>
                    <dd>{clientName ? `${clientName}, ${contactMethod}: ${contactValue}` : "Не указан"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Файлы</dt>
                    <dd>{attachmentFiles.length ? `${attachmentFiles.length} файл(ов)` : "Не приложены"}</dd>
                  </div>
                </dl>
              </div>

              <Field label="Комментарий">
                <LimitedTextarea
                  className={textareaClass}
                  maxLength={fieldLimits.order.comment.max}
                  name="comment"
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Дополнительные пожелания, вопросы или ограничения"
                  value={comment}
                />
              </Field>

              {state.message ? (
                <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
                  {state.message}
                </div>
              ) : null}
              {!canSubmitOrder ? (
                <div className="border border-line bg-paper px-4 py-3 text-sm leading-6 text-muted">
                  Отправка заказа будет доступна после выбора услуги с настроенным пакетом работ и проверки файлов.
                </div>
              ) : null}
              {canSubmitOrder && isSubmitDelayActive ? (
                <p className="text-sm leading-6 text-muted" id="order-submit-delay" aria-live="polite">
                  Отправка будет доступна через {submitDelaySeconds} сек.
                </p>
              ) : null}
              <FormSubmitButton
                className="focus-ring inline-flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 md:w-auto"
                describedBy={canSubmitOrder && isSubmitDelayActive ? "order-submit-delay" : undefined}
                disabled={!canSubmitOrder || isSubmitDelayActive}
                idleLabel="Отправить заказ"
                pendingLabel="Отправка..."
              />
            </div>
          </StepPanel>

          <div className="flex flex-col justify-between gap-3 border-t border-line pt-5 sm:flex-row">
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              disabled={activeStepIndex === 0}
              onClick={goBack}
              type="button"
            >
              Назад
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-ink hover:text-ink"
                onClick={clearDraft}
                type="button"
              >
                Очистить черновик
              </button>
              {activeStepId !== "review" ? (
                <button
                  className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent"
                  onClick={goNext}
                  type="button"
                >
                  Далее
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <OrderSummaryAside
          addonTitles={selectedAddons.map((addon) => addon.title)}
          estimate={estimate}
          packageTitle={selectedPackage?.title ?? ""}
          serviceTitle={selectedService?.title ?? ""}
        />
      </div>

      <MobileOrderSummary
        addonTitles={selectedAddons.map((addon) => addon.title)}
        estimate={estimate}
        onOpenReview={() => setActiveStepId("review")}
        packageTitle={selectedPackage?.title ?? ""}
        serviceTitle={selectedService?.title ?? ""}
      />
    </form>
  );
}
