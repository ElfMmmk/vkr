import Link from "next/link";
import { notFound } from "next/navigation";

import {
  acceptOrderContractAction,
  uploadClientOrderAttachmentAction
} from "@/app/account/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { RouteFlashToast } from "@/components/route-flash-toast";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { requireClientSession } from "@/lib/auth";
import { getClientRequestById } from "@/lib/data/client";
import { MAX_ORDER_ATTACHMENT_COUNT } from "@/lib/order-attachments";
import { createOrderAttachmentSignedUrls } from "@/lib/order-attachment-storage";
import { formatDurationRange, formatPriceRange, formatRubles } from "@/lib/order-calculator";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";

type AccountRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} КБ`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

export default async function AccountRequestDetailPage({ params }: AccountRequestDetailPageProps) {
  const session = await requireClientSession();
  const { id } = await params;
  const request = await getClientRequestById(session.id, id);

  if (!request) {
    notFound();
  }

  const client = getSupabaseAdminOrThrow();
  const attachments = await createOrderAttachmentSignedUrls(client, request.attachments);
  const canUploadAttachments =
    request.status !== "completed" &&
    request.status !== "rejected" &&
    attachments.length < MAX_ORDER_ATTACHMENT_COUNT;

  return (
    <>
      <SiteHeader />
      <RouteFlashToast />
      <main id="main-content" className="container-shell py-16 md:py-24">
        <Link className="text-sm font-semibold text-accent hover:text-ink" href="/account">
          ← К списку заказов
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 border-b border-line pb-8 md:flex-row md:items-start">
          <div>
            <p className="text-sm text-muted">{new Date(request.createdAt).toLocaleString("ru-RU")}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">
              {request.serviceTitle || "Заявка на дизайн"}
            </h1>
            <p className="mt-3 text-muted">
              {request.packageTitle || "Пакет не выбран"} ·{" "}
              {formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo)}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-line bg-white p-5">
              <h2 className="text-2xl font-semibold">Бриф</h2>
              <dl className="mt-5 grid gap-4 text-sm leading-6 md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-muted">Предварительная стоимость</dt>
                  <dd>{formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted">Предварительный срок</dt>
                  <dd>
                    {formatDurationRange(
                      request.estimatedDurationFromDays,
                      request.estimatedDurationToDays
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted">Способ связи</dt>
                  <dd>
                    {request.contactMethod}: {request.contactValue}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted">Желаемый срок</dt>
                  <dd>{request.desiredDeadline || "Не указан"}</dd>
                </div>
              </dl>
              <div className="mt-6 grid gap-5 text-sm leading-6">
                <section>
                  <h3 className="font-semibold">Ожидаемый результат</h3>
                  <p className="mt-2 text-muted">{request.resultDescription || request.comment}</p>
                </section>
                <section>
                  <h3 className="font-semibold">Стиль и ориентиры</h3>
                  <p className="mt-2 text-muted">{request.stylePreferences || "Не указано"}</p>
                </section>
                <section>
                  <h3 className="font-semibold">Материалы</h3>
                  <p className="mt-2 text-muted">{request.materials || "Не указано"}</p>
                </section>
                {request.selectedAddons.length ? (
                  <section>
                    <h3 className="font-semibold">Доплаты</h3>
                    <ul className="mt-2 grid gap-2 text-muted">
                      {request.selectedAddons.map((addon) => (
                        <li key={addon.id}>
                          {addon.title}: +{formatRubles(addon.price)}
                          {addon.durationDays ? `, +${addon.durationDays} раб. дн.` : ""}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            </section>

            {request.contract && ["sent", "accepted"].includes(request.contract.status) ? (
              <section className="border border-cobalt/25 bg-cobalt/10 p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">Договор-заказ</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Итоговая стоимость: {formatRubles(request.contract.finalPrice)} · срок:{" "}
                      {request.contract.finalDurationDays} раб. дн.
                    </p>
                  </div>
                  <span className="border border-cobalt/25 bg-white px-3 py-1.5 text-sm font-semibold text-cobalt">
                    {request.contract.status === "accepted" ? "Принят" : "На согласовании"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6">{request.contract.workScope}</p>
                {request.contract.managerComment ? (
                  <p className="mt-3 text-sm leading-6 text-muted">{request.contract.managerComment}</p>
                ) : null}
                {request.contract.status === "sent" ? (
                  <form action={acceptOrderContractAction} className="mt-5">
                    <input name="requestId" type="hidden" value={request.id} />
                    <input name="contractId" type="hidden" value={request.contract.id} />
                    <FormSubmitButton
                      className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                      idleLabel="Принять договор-заказ"
                      pendingLabel="Принятие..."
                    />
                  </form>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="border border-line bg-white p-5">
              <h2 className="text-xl font-semibold">Материалы</h2>
              {attachments.length ? (
                <ul className="mt-4 grid gap-3 text-sm leading-6">
                  {attachments.map((attachment) => (
                    <li className="border border-line bg-paper p-3" key={attachment.id}>
                      {attachment.signedUrl ? (
                        <a className="font-semibold text-accent hover:text-ink" href={attachment.signedUrl}>
                          {attachment.fileName}
                        </a>
                      ) : (
                        <span className="font-semibold">{attachment.fileName}</span>
                      )}
                      <p className="mt-1 text-muted">{formatBytes(attachment.size)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted">Материалы ещё не приложены.</p>
              )}

              {canUploadAttachments ? (
                <form action={uploadClientOrderAttachmentAction} className="mt-5 grid gap-3">
                  <input name="requestId" type="hidden" value={request.id} />
                  <input
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain"
                    className="block w-full border border-line bg-white px-3 py-2 text-sm"
                    multiple
                    name="attachments"
                    type="file"
                  />
                  <p className="text-sm leading-6 text-muted">
                    Можно добавить ещё {MAX_ORDER_ATTACHMENT_COUNT - attachments.length} файл(ов).
                  </p>
                  <FormSubmitButton
                    className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                    idleLabel="Добавить материалы"
                    pendingLabel="Загрузка..."
                  />
                </form>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted">
                  Добавление материалов закрыто для завершённых или отклонённых заявок либо после достижения лимита.
                </p>
              )}
            </section>

            <section className="border border-line bg-paper p-5">
              <h2 className="text-xl font-semibold">Таймлайн</h2>
              <ol className="mt-4 grid gap-3 text-sm leading-6">
                <li>Заявка создана: {new Date(request.createdAt).toLocaleString("ru-RU")}</li>
                <li>Статус: {request.status}</li>
                {request.contract ? <li>Договор-заказ подготовлен</li> : <li>Договор-заказ ожидает подготовки</li>}
                {request.contract?.acceptedAt ? (
                  <li>Принят: {new Date(request.contract.acceptedAt).toLocaleString("ru-RU")}</li>
                ) : null}
              </ol>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
