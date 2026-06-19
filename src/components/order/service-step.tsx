import { Field, selectClass } from "@/components/form-controls";
import { FieldError, invalidClass } from "@/components/order/form-parts";
import { getQuizQuestionOptions } from "@/components/order/order-form-config";
import { PackageStep } from "@/components/order/package-step";
import type { Locale } from "@/lib/i18n";
import type { OrderQuizAnswers } from "@/lib/order-quiz";
import type { Service, ServicePackage } from "@/lib/types";

type FieldErrors = Record<string, string[]> | undefined;

type QuizOption = {
  label: string;
  value: OrderQuizAnswers[keyof OrderQuizAnswers];
};

type ServiceStepProps = {
  services: Service[];
  selectedServiceId: string;
  fieldErrors: FieldErrors;
  isQuizOpen: boolean;
  locale: Locale;
  quizAnswers: Partial<OrderQuizAnswers>;
  onApplyQuizRecommendation: () => void;
  onSelectQuizAnswer: (
    key: keyof OrderQuizAnswers,
    value: OrderQuizAnswers[keyof OrderQuizAnswers]
  ) => void;
  onSelectPackage: (packageId: string) => void;
  onSelectService: (serviceId: string) => void;
  onToggleQuiz: () => void;
  packages: ServicePackage[];
  selectedPackageId: string;
};

export function ServiceStep({
  fieldErrors,
  isQuizOpen,
  locale,
  onApplyQuizRecommendation,
  onSelectPackage,
  onSelectQuizAnswer,
  onSelectService,
  onToggleQuiz,
  packages,
  quizAnswers,
  selectedPackageId,
  selectedServiceId,
  services
}: ServiceStepProps) {
  const quizQuestionLabels: Record<keyof OrderQuizAnswers, string> = locale === "en"
    ? {
        goal: "Goal",
        materials: "Materials",
        scope: "Scope",
        taskType: "Task type",
        urgency: "Timing"
      }
    : {
        goal: "Цель",
        materials: "Материалы",
        scope: "Объём",
        taskType: "Тип задачи",
        urgency: "Срок"
      };
  const quizEntries = Object.entries(getQuizQuestionOptions(locale)) as Array<
    [keyof OrderQuizAnswers, readonly QuizOption[]]
  >;

  return (
    <div className="grid gap-5">
      <div className="border border-line bg-paper p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-semibold">
              {locale === "en" ? "Not sure what to choose?" : "Не знаете, что выбрать?"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              {locale === "en"
                ? "Answer five questions and the form will suggest a suitable direction."
                : "Ответьте на пять вопросов, и форма подставит подходящее направление."}
            </p>
          </div>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
            onClick={onToggleQuiz}
            type="button"
          >
            {locale === "en" ? "Help me choose" : "Помочь выбрать"}
          </button>
        </div>

        {isQuizOpen ? (
          <div className="mt-5 grid gap-4">
            {quizEntries.map(([key, options]) => (
              <div key={key}>
                <p className="text-sm font-semibold text-ink">{quizQuestionLabels[key]}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      className={`focus-ring border px-3 py-2 text-sm font-semibold transition ${
                        quizAnswers[key] === option.value
                          ? "border-cobalt bg-cobalt text-white"
                          : "border-line bg-white text-ink hover:border-ink"
                      }`}
                      key={option.value}
                      onClick={() => onSelectQuizAnswer(key, option.value)}
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
              onClick={onApplyQuizRecommendation}
              type="button"
            >
              {locale === "en" ? "Apply recommendation" : "Подобрать услугу"}
            </button>
          </div>
        ) : null}
      </div>

      <Field label={locale === "en" ? "Service" : "Услуга"} required>
        <select
          className={`${selectClass}${invalidClass(Boolean(fieldErrors?.serviceId))}`}
          name="serviceId"
          onChange={(event) => onSelectService(event.target.value)}
          required
          value={selectedServiceId}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
        <FieldError errors={fieldErrors?.serviceId} />
      </Field>

      <section>
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-ink">{locale === "en" ? "Package" : "Пакет"}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            {locale === "en"
              ? "Compare scope, preliminary price, and timing."
              : "Сравните состав, предварительную стоимость и срок."}
          </p>
        </div>
        <PackageStep
          errors={fieldErrors?.packageId}
          locale={locale}
          onSelectPackage={onSelectPackage}
          packages={packages}
          selectedPackageId={selectedPackageId}
        />
      </section>
    </div>
  );
}
