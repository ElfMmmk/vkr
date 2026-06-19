import Link from "next/link";

import { AccountAuthForm } from "@/components/account-auth-form";
import { RouteFlashToast } from "@/components/route-flash-toast";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n-server";

export default async function AccountLoginPage({
  searchParams
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const claimQuery = params.claim ? `?claim=${encodeURIComponent(params.claim)}` : "";

  return (
    <>
      <SiteHeader />
      <RouteFlashToast locale={locale} />
      <main id="main-content" className="container-shell grid gap-8 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.6fr)] md:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {locale === "en" ? "Client account" : "Личный кабинет"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            {locale === "en" ? "Client sign in" : "Вход клиента"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            {locale === "en"
              ? "Your account contains submitted requests, selected services, current statuses, and approved order terms."
              : "В кабинете клиент видит отправленные заявки, выбранные услуги и текущие статусы обработки без доступа к административным данным."}
          </p>
          <Link className="focus-ring mt-6 inline-flex text-sm font-semibold text-accent hover:text-ink" href={`/account/register${claimQuery}`}>
            {locale === "en" ? "No account yet? Register" : "Нет кабинета? Зарегистрироваться"}
          </Link>
        </div>
        <AccountAuthForm claimToken={params.claim ?? ""} locale={locale} mode="login" />
      </main>
      <SiteFooter />
    </>
  );
}
