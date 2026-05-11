"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  AdminFormFieldset,
  adminPrimaryButtonClass
} from "@/components/admin-form-lock";
import { Field, inputClass } from "@/components/form-controls";
import {
  uploadImageAction,
  type UploadImageState
} from "@/lib/actions/admin";

const initialState: UploadImageState = {
  ok: false,
  message: ""
};

function SubmitButton({ canWrite }: { canWrite: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className={adminPrimaryButtonClass} disabled={!canWrite || pending}>
      {pending ? "Загрузка..." : "Загрузить"}
    </button>
  );
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
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <AdminFormFieldset canWrite={canWrite}>
        <Field label="Файл">
          <input
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className={inputClass}
            name="file"
            ref={fileInputRef}
            type="file"
          />
        </Field>
        <Field
          label="Название"
          hint="Короткое имя для поиска в медиатеке, например: Обложка Botanica"
        >
          <input className={inputClass} name="title" placeholder="Обложка проекта" />
        </Field>
        <Field label="Описание">
          <input
            className={inputClass}
            name="caption"
            placeholder="Что изображено или где использовать файл"
          />
        </Field>
        <input name="sortOrder" type="hidden" value="100" />
        {state.message ? (
          <p
            className={`border px-4 py-3 text-sm ${
              state.ok
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
          >
            {state.message}
          </p>
        ) : null}
        <SubmitButton canWrite={canWrite} />
      </AdminFormFieldset>
    </form>
  );
}
