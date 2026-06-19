import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, textareaClass } from "@/components/form-controls";
import { LimitedTextarea } from "@/components/limited-text-control";
import { getContactMethodLabel } from "@/lib/contact";
import { fieldLimits } from "@/lib/field-limits";
import type { Locale } from "@/lib/i18n";
import {
  formatDurationRange,
  formatPriceRange,
  type OrderEstimate
} from "@/lib/order-calculator";

type ReviewStepProps = {
  attachmentCount: number;
  canSubmitOrder: boolean;
  clientName: string;
  comment: string;
  contactMethod: string;
  contactValue: string;
  estimate: OrderEstimate | null;
  isSubmitDelayActive: boolean;
  locale: Locale;
  message?: string;
  packageTitle: string;
  serviceTitle: string;
  setComment: (comment: string) => void;
  submitDelaySeconds: number;
};

export function ReviewStep({
  attachmentCount,
  canSubmitOrder,
  clientName,
  comment,
  contactMethod,
  contactValue,
  estimate,
  isSubmitDelayActive,
  locale,
  message,
  packageTitle,
  serviceTitle,
  setComment,
  submitDelaySeconds
}: ReviewStepProps) {
  return (
    <div className="grid gap-5">
      <div className="border border-cobalt/25 bg-cobalt/10 p-5">
        <h3 className="text-xl font-semibold text-ink">
          {locale === "en" ? "Review your order" : "Проверьте заказ"}
        </h3>
        <dl className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink">{locale === "en" ? "Service" : "Услуга"}</dt>
            <dd>{serviceTitle || (locale === "en" ? "Not selected" : "Не выбрана")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{locale === "en" ? "Package" : "Пакет"}</dt>
            <dd>{packageTitle || (locale === "en" ? "Not selected" : "Не выбран")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{locale === "en" ? "Preliminary price" : "Предварительная стоимость"}</dt>
            <dd>{estimate ? formatPriceRange(estimate.priceFrom, estimate.priceTo, locale) : locale === "en" ? "To be confirmed" : "Уточняется"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{locale === "en" ? "Preliminary timing" : "Предварительный срок"}</dt>
            <dd>
              {estimate
                ? formatDurationRange(estimate.durationFromDays, estimate.durationToDays, locale)
                : locale === "en" ? "To be confirmed" : "Уточняется"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{locale === "en" ? "Contact" : "Контакт"}</dt>
            <dd>
              {clientName
                ? `${clientName}, ${getContactMethodLabel(contactMethod, locale)}: ${contactValue}`
                : locale === "en"
                  ? "Not provided"
                  : "Не указан"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">{locale === "en" ? "Files" : "Файлы"}</dt>
            <dd>{attachmentCount ? `${attachmentCount} ${locale === "en" ? "file(s)" : "файл(ов)"}` : locale === "en" ? "No files" : "Не приложены"}</dd>
          </div>
        </dl>
      </div>

      <Field label={locale === "en" ? "Comment" : "Комментарий"}>
        <LimitedTextarea
          className={textareaClass}
          maxLength={fieldLimits.order.comment.max}
          name="comment"
          onChange={(event) => setComment(event.target.value)}
          placeholder={locale === "en" ? "Additional preferences, questions, or constraints" : "Дополнительные пожелания, вопросы или ограничения"}
          value={comment}
        />
      </Field>

      {message ? (
        <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
          {message}
        </div>
      ) : null}
      {!canSubmitOrder ? (
        <div className="border border-line bg-paper px-4 py-3 text-sm leading-6 text-muted">
          {locale === "en"
            ? "Submission becomes available after selecting a service package and resolving file errors."
            : "Отправка заказа будет доступна после выбора услуги с настроенным пакетом работ и проверки файлов."}
        </div>
      ) : null}
      {canSubmitOrder && isSubmitDelayActive ? (
        <p className="text-sm leading-6 text-muted" id="order-submit-delay" aria-live="polite">
          {locale === "en"
            ? `Submission will be available in ${submitDelaySeconds} sec.`
            : `Отправка будет доступна через ${submitDelaySeconds} сек.`}
        </p>
      ) : null}
      <FormSubmitButton
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 md:w-auto"
        describedBy={canSubmitOrder && isSubmitDelayActive ? "order-submit-delay" : undefined}
        disabled={!canSubmitOrder || isSubmitDelayActive}
        idleLabel={locale === "en" ? "Send request" : "Отправить заказ"}
        pendingLabel={locale === "en" ? "Sending..." : "Отправка..."}
      />
    </div>
  );
}
