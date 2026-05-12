import Link from "next/link";

import { clientSignOutAction } from "@/app/account/actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { requireClientSession } from "@/lib/auth";
import { listClientRequests } from "@/lib/data/client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireClientSession();
  const requests = await listClientRequests(session.id);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell py-16 md:py-24">
        <div className="flex flex-col justify-between gap-5 border-b border-line pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Личный кабинет
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              {session.fullName || session.email}
            </h1>
            <p className="mt-3 text-muted">{session.email}</p>
          </div>
          <form action={clientSignOutAction}>
            <button className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px">
              Выйти
            </button>
          </form>
        </div>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold">Мои заявки</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Отображаются только заявки, отправленные из текущего кабинета.
              </p>
            </div>
            <Link
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
              href="/order"
            >
              Новая заявка
            </Link>
          </div>

          {requests.length ? (
            <div className="mt-6 grid gap-4">
              {requests.map((request) => (
                <article className="border border-line bg-white p-5" key={request.id}>
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="text-sm text-muted">
                        {new Date(request.createdAt).toLocaleString("ru-RU")}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold">
                        {request.serviceTitle || "Заявка на дизайн"}
                      </h3>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">{request.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-line bg-white p-8 text-center">
              <h3 className="text-xl font-semibold">Заявок пока нет</h3>
              <p className="mt-2 text-muted">Создайте первую заявку, чтобы отслеживать её статус здесь.</p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
