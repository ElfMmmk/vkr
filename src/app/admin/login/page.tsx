import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { getAdminEmail, isAdminPreviewEnabled } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/supabase/server";

export default function AdminLoginPage() {
  const setupReady = hasSupabasePublicEnv() && Boolean(getAdminEmail());
  const previewEnabled = isAdminPreviewEnabled();

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-md border border-line bg-white p-8 shadow-soft">
        <Link className="text-sm font-semibold text-muted hover:text-ink" href="/">
          ← На сайт
        </Link>
        <h1 className="mt-8 text-4xl font-semibold">Вход в админку</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Войдите, чтобы перейти к управлению контентом сайта.
        </p>
        {!setupReady ? (
          <div className="mt-6 border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-accent">
            Для входа завершите настройку Supabase и администратора в окружении проекта.
          </div>
        ) : null}
        <div className="mt-8">
          <LoginForm previewEnabled={previewEnabled} />
        </div>
      </section>
    </main>
  );
}
