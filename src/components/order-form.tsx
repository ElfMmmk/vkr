"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { submitOrderAction, type OrderFormState } from "@/app/order/actions";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import type { Service } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="focus-ring inline-flex w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Отправка..." : "Отправить заявку"}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-2 text-sm text-accent">{errors[0]}</p>;
}

export function OrderForm({ services }: { services: Service[] }) {
  const initialState: OrderFormState = {};
  const [state, formAction] = useActionState(submitOrderAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Имя">
        <input className={inputClass} name="clientName" placeholder="Как к вам обращаться" />
        <FieldError errors={state.fieldErrors?.clientName} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Способ связи">
          <select className={selectClass} name="contactMethod" defaultValue="Telegram">
            <option>Telegram</option>
            <option>Email</option>
            <option>Телефон</option>
            <option>Другой способ</option>
          </select>
          <FieldError errors={state.fieldErrors?.contactMethod} />
        </Field>
        <Field label="Контакт">
          <input className={inputClass} name="contactValue" placeholder="@username или email" />
          <FieldError errors={state.fieldErrors?.contactValue} />
        </Field>
      </div>
      <Field label="Услуга">
        <select className={selectClass} name="serviceId" defaultValue="">
          <option value="">Пока не выбрано</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Краткое описание задачи">
        <textarea
          className={textareaClass}
          name="comment"
          placeholder="Расскажите, что нужно сделать, какие есть сроки и материалы."
        />
        <FieldError errors={state.fieldErrors?.comment} />
      </Field>
      {state.message ? (
        <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
          {state.message}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
