"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { submitOrderAction, type OrderFormState } from "@/app/order/actions";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import type { Service } from "@/lib/types";

const contactPlaceholders: Record<string, string> = {
  Telegram: "@username",
  Email: "name@example.com",
  Телефон: "+7 999 000-00-00",
  "Другой способ": "Напишите удобный способ связи"
};

function invalidClass(hasError: boolean) {
  return hasError ? " border-accent bg-accent/5 focus-visible:border-accent" : "";
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="focus-ring inline-flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 md:w-auto"
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

function ServiceCombobox({
  services,
  selectedServiceId,
  serviceTitle,
  hasError,
  onSelect,
  onTitleChange
}: {
  services: Service[];
  selectedServiceId: string;
  serviceTitle: string;
  hasError: boolean;
  onSelect: (service: Service) => void;
  onTitleChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleServices = useMemo(() => {
    const query = serviceTitle.trim().toLowerCase();

    if (!query) {
      return services;
    }

    return services.filter((service) => service.title.toLowerCase().includes(query));
  }, [serviceTitle, services]);

  return (
    <div className="relative">
      <input name="serviceId" type="hidden" value={selectedServiceId} />
      <input name="serviceTitle" type="hidden" value={serviceTitle} />
      <input
        aria-autocomplete="list"
        aria-expanded={isOpen}
        className={`${inputClass}${invalidClass(hasError)}`}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          onTitleChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Начните вводить название услуги"
        role="combobox"
        type="text"
        value={serviceTitle}
      />
      {isOpen ? (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto border border-line bg-white shadow-soft">
          {visibleServices.length ? (
            visibleServices.map((service) => (
              <button
                className="focus-ring block w-full px-4 py-3 text-left text-sm transition hover:bg-paper active:bg-line"
                key={service.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(service);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span className="font-semibold text-ink">{service.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{service.description}</span>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted">Подходящих услуг не найдено</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function OrderForm({
  services,
  selectedServiceSlug
}: {
  services: Service[];
  selectedServiceSlug?: string;
}) {
  const initialState: OrderFormState = {};
  const initialService = services.find((service) => service.slug === selectedServiceSlug);
  const [state, formAction] = useActionState(submitOrderAction, initialState);
  const formStartedAtRef = useRef<HTMLInputElement>(null);
  const [clientName, setClientName] = useState("");
  const [contactMethod, setContactMethod] = useState("Telegram");
  const [contactValue, setContactValue] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id ?? "");
  const [serviceTitle, setServiceTitle] = useState(initialService?.title ?? "");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (formStartedAtRef.current) {
      formStartedAtRef.current.value = String(Date.now());
    }
  }, []);

  return (
    <form
      action={formAction}
      className="space-y-5"
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.tagName !== "TEXTAREA") {
          event.preventDefault();
        }
      }}
    >
      <input name="formStartedAt" ref={formStartedAtRef} type="hidden" />
      <label className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        Website
        <input autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>
      <Field label="Имя">
        <input
          className={`${inputClass}${invalidClass(Boolean(state.fieldErrors?.clientName))}`}
          name="clientName"
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Как к вам обращаться"
          value={clientName}
        />
        <FieldError errors={state.fieldErrors?.clientName} />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Способ связи">
          <select
            className={`${selectClass}${invalidClass(Boolean(state.fieldErrors?.contactMethod))}`}
            name="contactMethod"
            onChange={(event) => {
              setContactMethod(event.target.value);
              setContactValue("");
            }}
            value={contactMethod}
          >
            <option>Telegram</option>
            <option>Email</option>
            <option>Телефон</option>
            <option>Другой способ</option>
          </select>
          <FieldError errors={state.fieldErrors?.contactMethod} />
        </Field>
        <Field label="Контакт">
          <input
            className={`${inputClass}${invalidClass(Boolean(state.fieldErrors?.contactValue))}`}
            name="contactValue"
            onChange={(event) => setContactValue(event.target.value)}
            placeholder={contactPlaceholders[contactMethod]}
            value={contactValue}
          />
          <FieldError errors={state.fieldErrors?.contactValue} />
        </Field>
      </div>
      <Field label="Услуга">
        <ServiceCombobox
          hasError={Boolean(state.fieldErrors?.serviceId)}
          onSelect={(service) => {
            setSelectedServiceId(service.id);
            setServiceTitle(service.title);
          }}
          onTitleChange={(value) => {
            setServiceTitle(value);
            setSelectedServiceId("");
          }}
          selectedServiceId={selectedServiceId}
          serviceTitle={serviceTitle}
          services={services}
        />
        <FieldError errors={state.fieldErrors?.serviceId} />
      </Field>
      <Field label="Краткое описание задачи">
        <textarea
          className={`${textareaClass}${invalidClass(Boolean(state.fieldErrors?.comment))}`}
          name="comment"
          onChange={(event) => setComment(event.target.value)}
          placeholder="Расскажите, что нужно сделать, какие есть сроки и материалы"
          value={comment}
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
