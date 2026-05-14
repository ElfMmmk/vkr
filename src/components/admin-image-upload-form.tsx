"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  AdminFormFieldset,
  adminPrimaryButtonClass
} from "@/components/admin-form-lock";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass } from "@/components/form-controls";
import { LimitedInput } from "@/components/limited-text-control";
import { ToastMessage } from "@/components/route-flash-toast";
import {
  uploadImageAction,
  type UploadImageState
} from "@/lib/actions/admin";
import { fieldLimits } from "@/lib/field-limits";
import {
  ALLOWED_PORTFOLIO_IMAGE_TYPES,
  MAX_PORTFOLIO_IMAGE_UPLOAD_MB,
  MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES,
  PORTFOLIO_IMAGE_ACCEPT
} from "@/lib/uploads";

const initialState: UploadImageState = {
  ok: false,
  message: ""
};

function validateFileInput(input: HTMLInputElement | null): boolean {
  if (!input) {
    return true;
  }

  const file = input.files?.[0];
  let message = "";

  if (!file) {
    message = "Выберите изображение";
  } else if (file.size > MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES) {
    message = `Изображение должно быть не больше ${MAX_PORTFOLIO_IMAGE_UPLOAD_MB} МБ`;
  } else if (
    !ALLOWED_PORTFOLIO_IMAGE_TYPES.includes(
      file.type.toLowerCase() as typeof ALLOWED_PORTFOLIO_IMAGE_TYPES[number]
    )
  ) {
    message = "Загрузите JPEG, PNG, WebP, GIF или AVIF изображение";
  }

  input.setCustomValidity(message);

  return !message;
}

export function AdminImageUploadForm({ canWrite }: { canWrite: boolean }) {
  const [state, formAction] = useActionState(uploadImageAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [state.ok, state.message]);

  return (
    <form
      action={formAction}
      className="grid gap-4"
      onSubmit={(event) => {
        if (!validateFileInput(fileInputRef.current)) {
          event.preventDefault();
          fileInputRef.current?.reportValidity();
        }
      }}
      ref={formRef}
    >
      <AdminFormFieldset canWrite={canWrite}>
        <Field
          label="Файл"
          hint={`JPEG, PNG, WebP, GIF или AVIF до ${MAX_PORTFOLIO_IMAGE_UPLOAD_MB} МБ`}
          required
        >
          <input
            accept={PORTFOLIO_IMAGE_ACCEPT}
            className={inputClass}
            name="file"
            onChange={() => validateFileInput(fileInputRef.current)}
            ref={fileInputRef}
            required
            type="file"
          />
        </Field>
        <Field
          label="Название"
          hint="Короткое имя для поиска в медиатеке, например: Обложка Botanica"
        >
          <LimitedInput
            className={inputClass}
            maxLength={fieldLimits.image.title.max}
            name="title"
            placeholder="Обложка проекта"
          />
        </Field>
        <Field label="Описание">
          <LimitedInput
            className={inputClass}
            maxLength={fieldLimits.image.caption.max}
            name="caption"
            placeholder="Что изображено или где использовать файл"
          />
        </Field>
        <input name="sortOrder" type="hidden" value="100" />
        {state.message ? (
          <ToastMessage
            key={`${state.ok}-${state.message}`}
            message={state.message}
            tone={state.ok ? "success" : "error"}
          />
        ) : null}
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          disabled={!canWrite}
          idleLabel="Загрузить"
          pendingLabel="Загрузка..."
        />
      </AdminFormFieldset>
    </form>
  );
}
