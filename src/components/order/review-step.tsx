import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, textareaClass } from "@/components/form-controls";
import { LimitedTextarea } from "@/components/limited-text-control";
import { fieldLimits } from "@/lib/field-limits";
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
  message,
  packageTitle,
  serviceTitle,
  setComment,
  submitDelaySeconds
}: ReviewStepProps) {
  return (
    <div className="grid gap-5">
      <div className="border border-cobalt/25 bg-cobalt/10 p-5">
        <h3 className="text-xl font-semibold text-ink">Проверьте заказ</h3>
        <dl className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink">Услуга</dt>
            <dd>{serviceTitle || "Не выбрана"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Пакет</dt>
            <dd>{packageTitle || "Не выбран"}</dd>
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
          <div>
            <dt className="font-semibold text-ink">Контакт</dt>
            <dd>{clientName ? `${clientName}, ${contactMethod}: ${contactValue}` : "Не указан"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Файлы</dt>
            <dd>{attachmentCount ? `${attachmentCount} файл(ов)` : "Не приложены"}</dd>
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

      {message ? (
        <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
          {message}
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
  );
}
