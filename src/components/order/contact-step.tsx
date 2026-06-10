import type { Dispatch, SetStateAction } from "react";

import { Field, inputClass, selectClass } from "@/components/form-controls";
import { LimitedInput } from "@/components/limited-text-control";
import {
  FieldError,
  fileListToMetadata,
  formatBytes,
  invalidClass
} from "@/components/order/form-parts";
import { contactPlaceholders } from "@/components/order/order-form-config";
import { fieldLimits } from "@/lib/field-limits";
import {
  MAX_ORDER_ATTACHMENT_COUNT,
  validateOrderAttachmentList,
  type OrderAttachmentFileLike
} from "@/lib/order-attachments";

type FieldErrors = Record<string, string[]> | undefined;

type ContactStepProps = {
  attachmentError: string;
  attachmentFiles: OrderAttachmentFileLike[];
  clientName: string;
  contactMethod: string;
  contactValue: string;
  fieldErrors: FieldErrors;
  setAttachmentError: Dispatch<SetStateAction<string>>;
  setAttachmentFiles: Dispatch<SetStateAction<OrderAttachmentFileLike[]>>;
  setClientName: Dispatch<SetStateAction<string>>;
  setContactMethod: Dispatch<SetStateAction<string>>;
  setContactValue: Dispatch<SetStateAction<string>>;
};

export function ContactStep({
  attachmentError,
  attachmentFiles,
  clientName,
  contactMethod,
  contactValue,
  fieldErrors,
  setAttachmentError,
  setAttachmentFiles,
  setClientName,
  setContactMethod,
  setContactValue
}: ContactStepProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Имя" required>
          <LimitedInput
            aria-invalid={Boolean(fieldErrors?.clientName) || undefined}
            className={`${inputClass}${invalidClass(Boolean(fieldErrors?.clientName))}`}
            maxLength={fieldLimits.order.clientName.max}
            name="clientName"
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Как к вам обращаться"
            required
            value={clientName}
          />
          <FieldError errors={fieldErrors?.clientName} />
        </Field>
        <Field label="Способ связи" required>
          <select
            className={`${selectClass}${invalidClass(Boolean(fieldErrors?.contactMethod))}`}
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
          <FieldError errors={fieldErrors?.contactMethod} />
        </Field>
      </div>

      <Field label="Контакт" required>
        <LimitedInput
          aria-invalid={Boolean(fieldErrors?.contactValue) || undefined}
          className={`${inputClass}${invalidClass(Boolean(fieldErrors?.contactValue))}`}
          maxLength={fieldLimits.order.contactValue.max}
          name="contactValue"
          onChange={(event) => setContactValue(event.target.value)}
          placeholder={contactPlaceholders[contactMethod]}
          required
          type={contactMethod === "Email" ? "email" : "text"}
          value={contactValue}
        />
        <FieldError errors={fieldErrors?.contactValue} />
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
  );
}
