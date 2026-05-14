"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass } from "@/components/form-controls";
import { LimitedInput } from "@/components/limited-text-control";
import { fieldLimits } from "@/lib/field-limits";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <Field label="Email администратора" required>
          <LimitedInput
            autoComplete="email"
            className={inputClass}
            maxLength={fieldLimits.login.email.max}
            name="email"
            required
            type="email"
          />
        </Field>
        <Field label="Пароль" required>
          <LimitedInput
            autoComplete="current-password"
            className={inputClass}
            maxLength={fieldLimits.login.password.max}
            minLength={fieldLimits.login.password.min}
            name="password"
            required
            type="password"
          />
        </Field>
        {state.message ? (
          <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
            {state.message}
          </div>
        ) : null}
        <FormSubmitButton
          className="focus-ring inline-flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0"
          idleLabel="Войти"
          pendingLabel="Вход..."
        />
      </form>
    </div>
  );
}
