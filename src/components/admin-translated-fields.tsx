"use client";

import { useMemo, useState } from "react";

import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import type { TranslationEntityType } from "@/lib/entity-translations";

export type AdminEditingLocale = "ru" | "en";

export type AdminTranslatedField = {
  name: string;
  label: string;
  hint?: string;
  kind?: "input" | "textarea";
  maxLength: number;
  minLength?: number;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  serializeAs?: "lines";
};

export function AdminLocaleTabs({
  locale,
  onChange
}: {
  locale: AdminEditingLocale;
  onChange: (locale: AdminEditingLocale) => void;
}) {
  const buttonClass = (value: AdminEditingLocale) =>
    `focus-ring min-h-10 min-w-16 border px-4 py-2 text-sm font-semibold transition ${
      locale === value
        ? "border-ink bg-ink text-white"
        : "border-line bg-white text-muted hover:border-ink hover:text-ink"
    }`;

  return (
    <div aria-label="Язык редактирования" className="inline-flex" role="group">
      <button className={buttonClass("ru")} onClick={() => onChange("ru")} type="button">RU</button>
      <button className={buttonClass("en")} onClick={() => onChange("en")} type="button">EN</button>
    </div>
  );
}

function initialValues(
  fields: AdminTranslatedField[],
  values: Record<string, unknown> | undefined
): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values?.[field.name];

      if (field.serializeAs === "lines" && Array.isArray(value)) {
        return [field.name, value.filter((item): item is string => typeof item === "string").join("\n")];
      }

      return [field.name, typeof value === "string" ? value : ""];
    })
  );
}

export function AdminTranslatedFields({
  english,
  entityType: _entityType,
  fields,
  russian
}: {
  english?: Record<string, unknown>;
  entityType: TranslationEntityType;
  fields: AdminTranslatedField[];
  russian: Record<string, unknown>;
}) {
  const [locale, setLocale] = useState<AdminEditingLocale>("ru");
  const [russianValues, setRussianValues] = useState(() => initialValues(fields, russian));
  const [englishValues, setEnglishValues] = useState(() => initialValues(fields, english));
  const activeValues = locale === "ru" ? russianValues : englishValues;
  const setActiveValue = (name: string, value: string) => {
    const setter = locale === "ru" ? setRussianValues : setEnglishValues;

    setter((current) => ({ ...current, [name]: value }));
  };
  const englishPayload = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          field.serializeAs === "lines"
            ? englishValues[field.name]
                ?.split(/\r?\n/)
                .map((item) => item.trim())
                .filter(Boolean) ?? []
            : englishValues[field.name] ?? ""
        ])
      ),
    [englishValues, fields]
  );

  return (
    <div className="grid gap-4 border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Текст на сайте</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            RU хранится в основном объекте, EN — в его английском переводе.
          </p>
        </div>
        <AdminLocaleTabs locale={locale} onChange={setLocale} />
      </div>
      {fields.map((field) => (
        <Field hint={field.hint} key={field.name} label={field.label} required={locale === "ru" && field.required}>
          {field.kind === "textarea" ? (
            <LimitedTextarea
              className={textareaClass}
              maxLength={field.maxLength}
              minLength={locale === "ru" ? field.minLength : undefined}
              onChange={(event) => setActiveValue(field.name, event.target.value)}
              placeholder={field.placeholder}
              required={locale === "ru" && field.required}
              rows={field.rows}
              value={activeValues[field.name] ?? ""}
            />
          ) : (
            <LimitedInput
              className={inputClass}
              maxLength={field.maxLength}
              minLength={locale === "ru" ? field.minLength : undefined}
              onChange={(event) => setActiveValue(field.name, event.target.value)}
              placeholder={field.placeholder}
              required={locale === "ru" && field.required}
              value={activeValues[field.name] ?? ""}
            />
          )}
        </Field>
      ))}
      {fields.map((field) => (
        <input key={field.name} name={field.name} type="hidden" value={russianValues[field.name] ?? ""} />
      ))}
      <input name="englishTranslation" type="hidden" value={JSON.stringify(englishPayload)} />
    </div>
  );
}
