import Link from "next/link";
import { notFound } from "next/navigation";

import {
  acceptOrderContractAction,
  deleteClientOrderAttachmentAction,
  requestOrderContractRevisionAction,
  uploadClientOrderAttachmentAction
} from "@/app/account/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ContractFeedbackThread } from "@/components/contract-feedback-thread";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { FormSubmitButton } from "@/components/form-submit-button";
import { OrderEstimateBreakdown } from "@/components/order-estimate-breakdown";
import { RouteFlashToast } from "@/components/route-flash-toast";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { requireClientSession } from "@/lib/auth";
import { getClientRequestById } from "@/lib/data/client";
import { MAX_ORDER_ATTACHMENT_COUNT } from "@/lib/order-attachments";
import { createOrderAttachmentSignedUrls } from "@/lib/order-attachment-storage";
import { formatRubles } from "@/lib/order-calculator";
import { buildRequestTimeline } from "@/lib/request-timeline";
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
  const timeline = buildRequestTimeline(request);
  const canManageAttachments =
    request.status !== "completed" &&
    request.status !== "rejected";
  const canUploadAttachments =
    canManageAttachments &&
    attachments.length < MAX_ORDER_ATTACHMENT_COUNT;
  const visibleContract =
    request.contract && ["sent", "revision_requested", "accepted"].includes(request.contract.status)
      ? request.contract
      : null;

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
              <OrderEstimateBreakdown compact request={request} />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={request.status} />
            <ContractStatusBadge status={visibleContract?.status} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-line bg-white p-5">
              <h2 className="text-2xl font-semibold">Бриф</h2>
              <dl className="mt-5 grid gap-4 text-sm leading-6 md:grid-cols-2">
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
              <div className="mt-5 border border-line bg-paper p-4">
                <OrderEstimateBreakdown request={request} />
              </div>
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

            {visibleContract ? (
              <section className="border border-cobalt/25 bg-cobalt/10 p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">Заказ</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Итоговая стоимость: {formatRubles(visibleContract.finalPrice)} · срок:{" "}
                      {visibleContract.finalDurationDays} раб. дн.
                    </p>
                  </div>
                  <ContractStatusBadge status={visibleContract.status} />
                </div>
                <p className="mt-4 text-sm leading-6">{visibleContract.workScope}</p>
                {visibleContract.managerComment ? (
                  <p className="mt-3 text-sm leading-6 text-muted">{visibleContract.managerComment}</p>
                ) : null}
                <ContractFeedbackThread feedback={visibleContract.feedback} viewer="client" />
                {visibleContract.status === "sent" ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <form action={acceptOrderContractAction}>
                      <input name="requestId" type="hidden" value={request.id} />
                      <input name="contractId" type="hidden" value={visibleContract.id} />
                      <FormSubmitButton
                        className="focus-ring inline-flex min-h-11 w-full items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                        idleLabel="Принять условия"
                        pendingLabel="Принятие..."
                      />
                    </form>
                    <details className="border border-line bg-white md:col-span-2">
                      <summary className="focus-ring cursor-pointer px-4 py-3 text-sm font-semibold text-ink">
                        Запросить изменения
                      </summary>
                      <form action={requestOrderContractRevisionAction} className="grid gap-3 border-t border-line p-4">
                        <input name="requestId" type="hidden" value={request.id} />
                        <input name="contractId" type="hidden" value={visibleContract.id} />
                        <label className="text-sm font-semibold" htmlFor="contract-feedback">
                          Что нужно изменить
                        </label>
                        <textarea
                          className="min-h-32 w-full border border-line bg-white px-3 py-2 text-sm leading-6"
                          id="contract-feedback"
                          maxLength={1000}
                          minLength={10}
                          name="feedback"
                          placeholder="Опишите, какие условия требуется уточнить или изменить"
                          required
                        />
                        <p className="text-xs text-muted">От 10 до 1000 символов.</p>
                        <FormSubmitButton
                          className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
                          idleLabel="Отправить комментарий"
                          pendingLabel="Отправка..."
                        />
                      </form>
                    </details>
                  </div>
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
                      <p className="font-semibold">{attachment.fileName}</p>
                      <p className="mt-1 text-muted">{formatBytes(attachment.size)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachment.signedUrl ? (
                          <a
                            className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                            download={attachment.fileName}
                            href={attachment.signedUrl}
                          >
                            Скачать
                          </a>
                        ) : null}
                        {canManageAttachments ? (
                          <form action={deleteClientOrderAttachmentAction}>
                            <input name="attachmentId" type="hidden" value={attachment.id} />
                            <input name="requestId" type="hidden" value={request.id} />
                            <ConfirmSubmitButton
                              className="focus-ring inline-flex min-h-10 items-center justify-center border border-accent bg-white px-3 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white"
                              message={`Удалить файл «${attachment.fileName}»?`}
                            >
                              Удалить
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted">Материалы ещё не приложены.</p>
              )}

              {canUploadAttachments ? (
                <form action={uploadClientOrderAttachmentAction} className="mt-5 grid gap-3">
                  <input name="requestId" type="hidden" value={request.id} />
                  <label className="text-sm font-semibold" htmlFor="account-request-attachments">
                    Добавить материалы
                  </label>
                  <input
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain"
                    className="block w-full border border-line bg-white px-3 py-2 text-sm"
                    id="account-request-attachments"
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
              <h2 className="text-xl font-semibold">История</h2>
              <ol className="mt-4 grid gap-3 text-sm leading-6">
                {timeline.map((event) => (
                  <li className="border-l-2 border-cobalt/30 pl-3" key={event.id}>
                    <time
                      className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                      dateTime={event.createdAt}
                    >
                      {new Date(event.createdAt).toLocaleString("ru-RU")}
                    </time>
                    <span className="mt-1 block font-semibold text-ink">{event.title}</span>
                    <span className="mt-1 block text-muted">{event.description}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
