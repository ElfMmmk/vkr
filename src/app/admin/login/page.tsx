import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { getAdminEmail } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/supabase/server";

export default function AdminLoginPage() {
  const setupReady = hasSupabasePublicEnv() && Boolean(getAdminEmail());

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-md overflow-hidden border border-line bg-white p-6 shadow-soft sm:p-8">
        <Link className="text-sm font-semibold text-muted hover:text-ink" href="/">
          ← На сайт
        </Link>
        <h1 className="mt-8 break-words text-3xl font-semibold leading-tight sm:text-4xl">
          Вход в служебную панель
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Войдите, чтобы работать с заказами и доступными разделами.
        </p>
        {!setupReady ? (
          <div className="mt-6 border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-accent">
            Вход временно недоступен: сервис авторизации ещё не настроен.
          </div>
        ) : null}
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
