"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, previewLoginAction, type LoginState } from "@/app/admin/login/actions";
import { Field, inputClass } from "@/components/form-controls";

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="focus-ring w-full border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Вход..." : "Войти"}
    </button>
  );
}

export function LoginForm({ previewEnabled }: { previewEnabled: boolean }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <Field label="Email администратора">
          <input className={inputClass} name="email" type="email" />
        </Field>
        <Field label="Пароль">
          <input className={inputClass} name="password" type="password" />
        </Field>
        {state.message ? (
          <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent">
            {state.message}
          </div>
        ) : null}
        <LoginButton />
      </form>
      {previewEnabled ? (
        <form action={previewLoginAction}>
          <button className="focus-ring w-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink">
            Войти в demo admin
          </button>
          <p className="mt-3 text-xs leading-5 text-muted">
            Локальный режим просмотра: данные не сохраняются, формы в админке отключены.
          </p>
        </form>
      ) : null}
    </div>
  );
}
