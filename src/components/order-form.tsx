"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { submitOrderAction, type OrderFormState } from "@/app/order/actions";
import { BriefStep } from "@/components/order/brief-step";
import { ContactStep } from "@/components/order/contact-step";
import { ExtrasStep } from "@/components/order/extras-step";
import { StepPanel } from "@/components/order/form-parts";
import { getOrderSteps, submitUnlockDelayMs } from "@/components/order/order-form-config";
import { MobileOrderSummary, OrderSummaryAside } from "@/components/order/order-summary";
import { ReviewStep } from "@/components/order/review-step";
import { ServiceStep } from "@/components/order/service-step";
import { StepNavigation } from "@/components/order/step-navigation";
import { fieldLimits } from "@/lib/field-limits";
import type { Locale } from "@/lib/i18n";
import { normalizeAndValidateContact } from "@/lib/contact";
import {
  LEGACY_ORDER_DRAFT_STORAGE_KEY,
  ORDER_DRAFT_STORAGE_KEY,
  ORDER_DRAFT_VERSION,
  appendBriefChip,
  parseOrderDraft,
  type OrderStepId
} from "@/lib/order-draft";
import type { OrderAttachmentFileLike } from "@/lib/order-attachments";
import {
  calculateOrderEstimate,
  formatDurationRange,
  formatPriceRange
} from "@/lib/order-calculator";
import {
  quizAnswersToBrief,
  recommendOrderSetup,
  type OrderQuizAnswers
} from "@/lib/order-quiz";
import { findFirstInvalidStepBeforeTarget } from "@/lib/order-step-navigation";
import type { Project, Service } from "@/lib/types";

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
  selectedServiceSlug,
  locale
}: {
  locale: Locale;
  projects: Project[];
  services: Service[];
  selectedServiceSlug?: string;
}) {
  const steps = getOrderSteps(locale);
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
    const currentDraft = window.localStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
    const legacyDraft = window.localStorage.getItem(LEGACY_ORDER_DRAFT_STORAGE_KEY);
    const draft = parseOrderDraft(currentDraft ?? legacyDraft);

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
      if (!currentDraft && legacyDraft) {
        window.localStorage.removeItem(LEGACY_ORDER_DRAFT_STORAGE_KEY);
      }
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

  function getStepError(stepId: OrderStepId): string | null {
    if (stepId === "service" && !selectedServiceId) {
      return locale === "en" ? "Choose a service or use the recommendation." : "Выберите услугу или пройдите подбор.";
    }

    if (stepId === "service" && !selectedPackageId) {
      return locale === "en" ? "Choose a work package." : "Выберите пакет работ.";
    }

    if (stepId === "brief") {
      if (resultDescription.trim().length < fieldLimits.order.resultDescription.min) {
        return locale === "en" ? "Describe the expected result in more detail." : "Опишите ожидаемый результат чуть подробнее.";
      }

      if (stylePreferences.trim().length < fieldLimits.order.stylePreferences.min) {
        return locale === "en" ? "Add a visual style or reference." : "Добавьте стиль или ориентир.";
      }
    }

    if (stepId === "contact") {
      if (!clientName.trim() || !contactValue.trim()) {
        return locale === "en" ? "Provide your name and contact details." : "Укажите имя и контакт для связи.";
      }

      const contactResult = normalizeAndValidateContact(contactMethod, contactValue);
      if (!contactResult.ok) {
        return locale === "en" ? "Check the contact details." : contactResult.error;
      }

      setContactValue(contactResult.value);

      if (attachmentError) {
        return attachmentError;
      }
    }

    return null;
  }

  function selectStep(stepId: OrderStepId, stepIndex: number) {
    if (stepIndex <= activeStepIndex) {
      setLocalStepError("");
      setActiveStepId(stepId);
      return;
    }

    const invalidStep = findFirstInvalidStepBeforeTarget(
      stepIndex,
      steps.map((step) => step.id),
      getStepError
    );

    if (invalidStep) {
      setActiveStepId(invalidStep.stepId);
      setLocalStepError(invalidStep.error);
      return;
    }

    setLocalStepError("");
    setActiveStepId(stepId);
  }

  function goNext() {
    const nextStep = steps[Math.min(activeStepIndex + 1, steps.length - 1)];

    selectStep(nextStep.id, Math.min(activeStepIndex + 1, steps.length - 1));
  }

  function goBack() {
    setLocalStepError("");
    const previousStep = steps[Math.max(activeStepIndex - 1, 0)];

    setActiveStepId(previousStep.id);
  }

  function applyQuizRecommendation() {
    if (!canUseQuizAnswers(quizAnswers)) {
      setLocalStepError(locale === "en" ? "Answer every recommendation question." : "Ответьте на вопросы подбора.");
      return;
    }

    const recommendation = recommendOrderSetup(quizAnswers, services);

    if (!recommendation) {
      setLocalStepError(locale === "en" ? "No recommendation was found. Choose a service manually." : "Не удалось подобрать услугу. Выберите её вручную.");
      return;
    }

    applyService(recommendation.serviceId);
    setSelectedPackageId(recommendation.packageId);
    setResultDescription((current) => appendBriefChip(current, quizAnswersToBrief(quizAnswers, locale)));
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
        duration: estimate ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays, locale) : "",
        files: attachmentFiles.map((file) => file.name),
        packageTitle: selectedPackage?.title ?? "",
        price: estimate ? formatPriceRange(estimate.priceFrom, estimate.priceTo, locale) : "",
        serviceTitle: selectedService?.title ?? ""
      })
    );
  }

  if (!services.length) {
    return (
      <div className="border border-line bg-paper p-5 text-sm leading-6 text-muted">
        {locale === "en" ? "No services are currently available for online ordering." : "Сейчас нет активных услуг для оформления заказа."}
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
      onSubmit={rememberSubmitSummary}
    >
      <input name="formStartedAt" ref={formStartedAtRef} type="hidden" />
      <input name="locale" type="hidden" value={locale} />
      <input name="serviceTitle" type="hidden" value={selectedService?.title ?? ""} />
      <label aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        Website
        <input aria-hidden="true" autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>

      {activeStepId !== "review" ? (
        <MobileOrderSummary
          addonTitles={selectedAddons.map((addon) => addon.title)}
          estimate={estimate}
          locale={locale}
          packageTitle={selectedPackage?.title ?? ""}
          serviceTitle={selectedService?.title ?? ""}
        />
      ) : null}

      <div className={`grid gap-6 ${activeStepId === "review" ? "" : "lg:grid-cols-[minmax(0,1fr)_340px]"}`}>
        <div className="min-w-0 space-y-6">
          <StepNavigation
            activeStepId={activeStepId}
            activeStepIndex={activeStepIndex}
            locale={locale}
            onSelectStep={selectStep}
            steps={steps}
          />

          <div className="border border-line bg-white p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              {locale === "en" ? "Step" : "Шаг"} {activeStepIndex + 1} {locale === "en" ? "of" : "из"} {steps.length}
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
            <ServiceStep
              fieldErrors={state.fieldErrors}
              isQuizOpen={isQuizOpen}
              locale={locale}
              onApplyQuizRecommendation={applyQuizRecommendation}
              onSelectQuizAnswer={(key, value) => {
                setQuizAnswers((current) => ({
                  ...current,
                  [key]: value
                }));
              }}
              onSelectPackage={setSelectedPackageId}
              onSelectService={applyService}
              onToggleQuiz={() => setIsQuizOpen((current) => !current)}
              packages={servicePackages}
              quizAnswers={quizAnswers}
              selectedPackageId={selectedPackageId}
              selectedServiceId={selectedServiceId}
              services={services}
            />
          </StepPanel>

          <StepPanel active={activeStepId === "extras"} id="extras">
            <ExtrasStep
              fieldErrors={state.fieldErrors}
              locale={locale}
              onSelectReferenceProject={setReferenceProjectId}
              onToggleAddon={toggleAddon}
              referenceProjectId={referenceProjectId}
              selectedAddonIds={selectedAddonIds}
              serviceAddons={serviceAddons}
              serviceExamples={serviceExamples}
            />
          </StepPanel>

          <StepPanel active={activeStepId === "brief"} id="brief">
            <BriefStep
              desiredDeadline={desiredDeadline}
              fieldErrors={state.fieldErrors}
              locale={locale}
              materials={materials}
              resultDescription={resultDescription}
              setDesiredDeadline={setDesiredDeadline}
              setMaterials={setMaterials}
              setResultDescription={setResultDescription}
              setStylePreferences={setStylePreferences}
              stylePreferences={stylePreferences}
            />
          </StepPanel>

          <StepPanel active={activeStepId === "contact"} id="contact">
            <ContactStep
              attachmentError={attachmentError}
              attachmentFiles={attachmentFiles}
              clientName={clientName}
              contactMethod={contactMethod}
              contactValue={contactValue}
              fieldErrors={state.fieldErrors}
              locale={locale}
              setAttachmentError={setAttachmentError}
              setAttachmentFiles={setAttachmentFiles}
              setClientName={setClientName}
              setContactMethod={setContactMethod}
              setContactValue={setContactValue}
            />
          </StepPanel>

          <StepPanel active={activeStepId === "review"} id="review">
            <ReviewStep
              attachmentCount={attachmentFiles.length}
              canSubmitOrder={canSubmitOrder}
              clientName={clientName}
              comment={comment}
              contactMethod={contactMethod}
              contactValue={contactValue}
              estimate={estimate}
              isSubmitDelayActive={isSubmitDelayActive}
              locale={locale}
              message={
                locale === "en" && state.message
                  ? "The request could not be sent. Check the fields and try again."
                  : state.message
              }
              packageTitle={selectedPackage?.title ?? ""}
              serviceTitle={selectedService?.title ?? ""}
              setComment={setComment}
              submitDelaySeconds={submitDelaySeconds}
            />
          </StepPanel>
          <div className="flex flex-col justify-between gap-3 border-t border-line pt-5 sm:flex-row">
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              disabled={activeStepIndex === 0}
              onClick={goBack}
              type="button"
            >
              {locale === "en" ? "Back" : "Назад"}
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-ink hover:text-ink"
                onClick={clearDraft}
                type="button"
              >
                {locale === "en" ? "Clear draft" : "Очистить черновик"}
              </button>
              {activeStepId !== "review" ? (
                <button
                  className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent"
                  onClick={goNext}
                  type="button"
                >
                  {locale === "en" ? "Next" : "Далее"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {activeStepId !== "review" ? (
          <OrderSummaryAside
            addonTitles={selectedAddons.map((addon) => addon.title)}
            estimate={estimate}
            locale={locale}
            packageTitle={selectedPackage?.title ?? ""}
            serviceTitle={selectedService?.title ?? ""}
          />
        ) : null}
      </div>
    </form>
  );
}
