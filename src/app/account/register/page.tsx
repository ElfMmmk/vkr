import Link from "next/link";

import { AccountAuthForm } from "@/components/account-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AccountRegisterPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell grid gap-8 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.6fr)] md:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Личный кабинет
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">Регистрация клиента</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            После регистрации новые заявки будут автоматически привязаны к кабинету, а клиент
            сможет отслеживать их состояние.
          </p>
          <Link className="focus-ring mt-6 inline-flex text-sm font-semibold text-accent hover:text-ink" href="/account/login">
            Уже есть кабинет? Войти
          </Link>
        </div>
        <AccountAuthForm mode="register" />
      </main>
      <SiteFooter />
    </>
  );
}
