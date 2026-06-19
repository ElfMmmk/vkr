import Link from "next/link";

import { clientSignOutAction } from "@/app/account/actions";
import { OrderEstimateBreakdown } from "@/components/order-estimate-breakdown";
import { RouteFlashToast } from "@/components/route-flash-toast";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { requireClientSession } from "@/lib/auth";
import { listClientRequests } from "@/lib/data/client";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const accountCopy: Record<
  Locale,
  {
    account: string;
    signOut: string;
    orders: string;
    description: string;
    newOrder: string;
    designRequest: string;
    package: string;
    notSelected: string;
    estimate: string;
    fixedTerms: string;
    openOrder: string;
    termsAwaiting: string;
    termsDescription: string;
    reviewTerms: string;
    emptyTitle: string;
    emptyText: string;
  }
> = {
  ru: {
    account: "Личный кабинет",
    signOut: "Выйти",
    orders: "Мои заказы",
    description: "Здесь отображаются заказы, предварительные расчёты и согласование условий.",
    newOrder: "Новый заказ",
    designRequest: "Заявка на дизайн",
    package: "Пакет",
    notSelected: "Не выбран",
    estimate: "Предварительно",
    fixedTerms: "Стоимость и срок",
    openOrder: "Открыть заказ",
    termsAwaiting: "Условия ждут подтверждения",
    termsDescription: "Проверьте состав работ, примите условия или запросите изменения.",
    reviewTerms: "Перейти к согласованию",
    emptyTitle: "Заказов пока нет",
    emptyText: "Оформите первый заказ, чтобы отслеживать его статус здесь."
  },
  en: {
    account: "Client account",
    signOut: "Sign out",
    orders: "My orders",
    description: "Your orders, estimates, and order-term approvals appear here.",
    newOrder: "New order",
    designRequest: "Design order",
    package: "Package",
    notSelected: "Not selected",
    estimate: "Estimate",
    fixedTerms: "Price and timing",
    openOrder: "Open order",
    termsAwaiting: "Order terms need your approval",
    termsDescription: "Review the scope, accept the terms, or request changes.",
    reviewTerms: "Review order terms",
    emptyTitle: "No orders yet",
    emptyText: "Submit your first order to track its status here."
  }
};

export default async function AccountPage() {
  const [session, locale] = await Promise.all([requireClientSession(), getLocale()]);
  const requests = await listClientRequests(session.id, locale);
  const copy = accountCopy[locale];

  return (
    <>
      <SiteHeader />
      <RouteFlashToast locale={locale} />
      <main id="main-content" className="container-shell py-16 md:py-24">
        <div className="flex flex-col justify-between gap-5 border-b border-line pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              {copy.account}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              {session.fullName || session.email}
            </h1>
            <p className="mt-3 text-muted">{session.email}</p>
          </div>
          <form action={clientSignOutAction}>
            <button className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px">
              {copy.signOut}
            </button>
          </form>
        </div>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold">{copy.orders}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {copy.description}
              </p>
            </div>
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
              href="/order"
            >
              {copy.newOrder}
            </Link>
          </div>

          {requests.length ? (
            <div className="mt-6 grid gap-4">
              {requests.map((request) => (
                <article className="border border-line bg-white p-5" key={request.id}>
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="text-sm text-muted">
                        {new Date(request.createdAt).toLocaleString(
                          locale === "en" ? "en-US" : "ru-RU"
                        )}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">
                        {request.serviceTitle || copy.designRequest}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge locale={locale} status={request.status} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
                    <p>
                      <span className="font-semibold">{copy.package}:</span>{" "}
                      {request.packageTitle || copy.notSelected}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {request.contract && ["sent", "revision_requested", "accepted"].includes(request.contract.status)
                          ? `${copy.fixedTerms}:`
                          : `${copy.estimate}:`}
                      </span>{" "}
                      <OrderEstimateBreakdown
                        compact
                        locale={locale}
                        fixedTerms={
                          request.contract && ["sent", "revision_requested", "accepted"].includes(request.contract.status)
                            ? {
                                finalPrice: request.contract.finalPrice,
                                finalDurationDays: request.contract.finalDurationDays
                              }
                            : undefined
                        }
                        request={request}
                      />
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    {request.resultDescription || request.comment}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                      href={`/account/requests/${request.id}`}
                    >
                      {copy.openOrder}
                    </Link>
                  </div>
                  {request.contract?.status === "sent" ? (
                    <div className="mt-5 border border-cobalt/25 bg-cobalt/10 p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <div>
                          <h4 className="text-lg font-semibold">{copy.termsAwaiting}</h4>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {copy.termsDescription}
                          </p>
                        </div>
                      </div>
                      <Link
                        className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                        href={`/account/requests/${request.id}`}
                      >
                        {copy.reviewTerms}
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-line bg-white p-8 text-center">
              <h3 className="text-xl font-semibold">{copy.emptyTitle}</h3>
              <p className="mt-2 text-muted">{copy.emptyText}</p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
