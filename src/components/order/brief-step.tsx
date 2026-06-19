import type { Dispatch, SetStateAction } from "react";

import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import { FieldError, invalidClass } from "@/components/order/form-parts";
import { getBriefChips } from "@/components/order/order-form-config";
import { fieldLimits } from "@/lib/field-limits";
import type { Locale } from "@/lib/i18n";
import { appendBriefChip } from "@/lib/order-draft";

type FieldErrors = Record<string, string[]> | undefined;

type BriefStepProps = {
  desiredDeadline: string;
  fieldErrors: FieldErrors;
  locale: Locale;
  materials: string;
  resultDescription: string;
  setDesiredDeadline: Dispatch<SetStateAction<string>>;
  setMaterials: Dispatch<SetStateAction<string>>;
  setResultDescription: Dispatch<SetStateAction<string>>;
  setStylePreferences: Dispatch<SetStateAction<string>>;
  stylePreferences: string;
};

export function BriefStep({
  desiredDeadline,
  fieldErrors,
  locale,
  materials,
  resultDescription,
  setDesiredDeadline,
  setMaterials,
  setResultDescription,
  setStylePreferences,
  stylePreferences
}: BriefStepProps) {
  const { materialChips, resultChips, styleChips } = getBriefChips(locale);

  return (
    <div className="grid gap-5">
      <Field label={locale === "en" ? "Expected result" : "Ожидаемый результат"} required>
        <LimitedTextarea
          aria-invalid={Boolean(fieldErrors?.resultDescription) || undefined}
          className={`${textareaClass}${invalidClass(Boolean(fieldErrors?.resultDescription))}`}
          maxLength={fieldLimits.order.resultDescription.max}
          minLength={fieldLimits.order.resultDescription.min}
          name="resultDescription"
          onChange={(event) => setResultDescription(event.target.value)}
          placeholder={locale === "en" ? "What should be created: logo, presentation, packaging, templates" : "Что должно быть сделано: логотип, презентация, упаковка, шаблоны, носители"}
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
        <FieldError errors={fieldErrors?.resultDescription} />
      </Field>

      <Field label={locale === "en" ? "Style and references" : "Стиль и ориентиры"} required>
        <LimitedTextarea
          aria-invalid={Boolean(fieldErrors?.stylePreferences) || undefined}
          className={`${textareaClass}${invalidClass(Boolean(fieldErrors?.stylePreferences))}`}
          maxLength={fieldLimits.order.stylePreferences.max}
          minLength={fieldLimits.order.stylePreferences.min}
          name="stylePreferences"
          onChange={(event) => setStylePreferences(event.target.value)}
          placeholder={locale === "en" ? "For example: minimal, bright, premium, close to the selected reference" : "Например: минималистично, ярко, премиально, похоже на выбранный пример"}
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
        <FieldError errors={fieldErrors?.stylePreferences} />
      </Field>

      <Field label={locale === "en" ? "Materials" : "Материалы"}>
        <LimitedTextarea
          className={textareaClass}
          maxLength={fieldLimits.order.materials.max}
          name="materials"
          onChange={(event) => setMaterials(event.target.value)}
          placeholder={locale === "en" ? "What is already available: copy, logo, photos, brand guide, dimensions" : "Что уже есть: тексты, логотип, фото, брендбук, размеры"}
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

      <Field label={locale === "en" ? "Preferred deadline" : "Желаемый срок"}>
        <LimitedInput
          className={inputClass}
          maxLength={fieldLimits.order.desiredDeadline.max}
          name="desiredDeadline"
          onChange={(event) => setDesiredDeadline(event.target.value)}
          placeholder={locale === "en" ? "For example: by June 20 or before launch" : "Например: до 20 июня или к запуску"}
          value={desiredDeadline}
        />
      </Field>
    </div>
  );
}
