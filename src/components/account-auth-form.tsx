"use client";

import { useActionState } from "react";

import {
  clientLoginAction,
  clientRegisterAction,
  type AccountFormState
} from "@/app/account/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass } from "@/components/form-controls";

export function AccountAuthForm({ claimToken = "", mode }: { claimToken?: string; mode: "login" | "register" }) {
  const action = mode === "login" ? clientLoginAction : clientRegisterAction;
  const [state, formAction] = useActionState<AccountFormState, FormData>(action, {});
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="grid gap-5 border border-line bg-white p-6">
      <input name="claimToken" type="hidden" value={claimToken} />
      {isRegister ? (
        <Field label="Имя" required>
          <input
            autoComplete="name"
            className={inputClass}
            maxLength={120}
            minLength={2}
            name="fullName"
            required
            type="text"
          />
        </Field>
      ) : null}
      <Field label="Email" required>
        <input
          autoComplete="email"
          className={inputClass}
          maxLength={160}
          name="email"
          required
          type="email"
        />
      </Field>
      <Field label="Пароль" required>
        <input
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={inputClass}
          maxLength={128}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </Field>
      {state.message ? (
        <p className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
          {state.message}
        </p>
      ) : null}
      <FormSubmitButton
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        idleLabel={isRegister ? "Создать кабинет" : "Войти"}
        pendingLabel={isRegister ? "Создание..." : "Вход..."}
      />
    </form>
  );
}
