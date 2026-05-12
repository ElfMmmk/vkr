import Link from "next/link";

import { AccountAuthForm } from "@/components/account-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AccountLoginPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell grid gap-8 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.6fr)] md:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Личный кабинет
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">Вход клиента</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            В кабинете клиент видит отправленные заявки, выбранные услуги и текущие статусы
            обработки без доступа к административным данным.
          </p>
          <Link className="focus-ring mt-6 inline-flex text-sm font-semibold text-accent hover:text-ink" href="/account/register">
            Нет кабинета? Зарегистрироваться
          </Link>
        </div>
        <AccountAuthForm mode="login" />
      </main>
      <SiteFooter />
    </>
  );
}
