import Link from "next/link";
import { notFound } from "next/navigation";

import {
  acceptOrderContractAction,
  deleteClientOrderAttachmentAction,
  saveClientOrderContractFeedbackAction,
  uploadClientOrderAttachmentAction
} from "@/app/account/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ContractFeedbackThread } from "@/components/contract-feedback-thread";
import { FormSubmitButton } from "@/components/form-submit-button";
import { OrderRevisionModal } from "@/components/order-revision-modal";
import { OrderEstimateBreakdown } from "@/components/order-estimate-breakdown";
import { RouteFlashToast } from "@/components/route-flash-toast";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { requireClientSession } from "@/lib/auth";
import { getContactMethodLabel } from "@/lib/contact";
import { getClientRequestById } from "@/lib/data/client";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { MAX_ORDER_ATTACHMENT_COUNT } from "@/lib/order-attachments";
import { createOrderAttachmentSignedUrls } from "@/lib/order-attachment-storage";
import { formatDurationRange, formatRubles } from "@/lib/order-calculator";
import { buildRequestTimeline } from "@/lib/request-timeline";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";

type AccountRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

const detailCopy = {
  ru: {
    back: "← К списку заказов",
    designRequest: "Заявка на дизайн",
    packageNotSelected: "Пакет не выбран",
    finalPrice: "Итоговая стоимость",
    completionTime: "Срок выполнения",
    brief: "Бриф",
    contactMethod: "Способ связи",
    desiredDeadline: "Желаемый срок",
    notSpecified: "Не указан",
    expectedResult: "Ожидаемый результат",
    style: "Стиль и ориентиры",
    materials: "Материалы",
    addons: "Дополнительные услуги",
    terms: "Условия заказа",
    price: "Стоимость",
    timing: "Срок",
    task: "Задача",
    accept: "Принять условия",
    accepting: "Принятие...",
    messageDesigner: "Сообщение дизайнеру",
    messagePlaceholder: "Напишите вопрос или уточнение по заказу",
    characterHint: "От 10 до 1000 символов.",
    sendMessage: "Отправить сообщение",
    sending: "Отправка...",
    download: "Скачать",
    delete: "Удалить",
    noMaterials: "Материалы ещё не приложены.",
    addMaterials: "Добавить материалы",
    upload: "Загрузка...",
    history: "История",
    attachmentClosed:
      "Добавление материалов закрыто для завершённых или отклонённых заявок либо после достижения лимита."
  },
  en: {
    back: "← Back to orders",
    designRequest: "Design order",
    packageNotSelected: "Package not selected",
    finalPrice: "Final price",
    completionTime: "Completion time",
    brief: "Brief",
    contactMethod: "Contact method",
    desiredDeadline: "Desired deadline",
    notSpecified: "Not specified",
    expectedResult: "Expected result",
    style: "Style and references",
    materials: "Files and materials",
    addons: "Add-ons",
    terms: "Order terms",
    price: "Price",
    timing: "Timing",
    task: "Scope",
    accept: "Accept terms",
    accepting: "Accepting...",
    messageDesigner: "Message the designer",
    messagePlaceholder: "Ask a question or clarify the order details",
    characterHint: "10 to 1,000 characters.",
    sendMessage: "Send message",
    sending: "Sending...",
    download: "Download",
    delete: "Delete",
    noMaterials: "No files have been attached yet.",
    addMaterials: "Add files",
    upload: "Uploading...",
    history: "History",
    attachmentClosed:
      "Files cannot be added to completed or rejected orders, or after the file limit is reached."
  }
} as const;

function formatBytes(size: number, locale: Locale): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} ${locale === "en" ? "KB" : "КБ"}`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} ${locale === "en" ? "MB" : "МБ"}`;
}

export default async function AccountRequestDetailPage({ params }: AccountRequestDetailPageProps) {
  const [session, locale, { id }] = await Promise.all([
    requireClientSession(),
    getLocale(),
    params
  ]);
  const request = await getClientRequestById(session.id, id, locale);

  if (!request) {
    notFound();
  }

  const client = getSupabaseAdminOrThrow();
  const attachments = await createOrderAttachmentSignedUrls(client, request.attachments);
  const timeline = buildRequestTimeline(request, locale);
  const copy = detailCopy[locale];
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
  const acceptedContract = visibleContract?.status === "accepted" ? visibleContract : null;
  const canCommentOnContract =
    Boolean(visibleContract && ["sent", "revision_requested"].includes(visibleContract.status));
  const shouldShowContractFeedback =
    Boolean(visibleContract && (canCommentOnContract || visibleContract.feedback.length > 0));
  const visibleContractWorkScope =
    visibleContract?.workScope.replace(/^(Задача|Task):\s*/i, "") ?? "";

  return (
    <>
      <SiteHeader />
      <RouteFlashToast locale={locale} />
      <main id="main-content" className="container-shell py-16 md:py-24">
        <Link className="text-sm font-semibold text-accent hover:text-ink" href="/account">
          {copy.back}
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 border-b border-line pb-8 md:flex-row md:items-start">
          <div>
            <p className="text-sm text-muted">
              {new Date(request.createdAt).toLocaleString(
                locale === "en" ? "en-US" : "ru-RU"
              )}
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">
              {request.serviceTitle || copy.designRequest}
            </h1>
            <p className="mt-3 text-muted">
              {request.packageTitle || copy.packageNotSelected} ·{" "}
              {acceptedContract ? (
                <>
                  {copy.finalPrice}: {formatRubles(acceptedContract.finalPrice, locale)} ·{" "}
                  {copy.completionTime}:{" "}
                  {formatDurationRange(
                    acceptedContract.finalDurationDays,
                    acceptedContract.finalDurationDays,
                    locale
                  )}
                </>
              ) : (
                <OrderEstimateBreakdown compact locale={locale} request={request} />
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge locale={locale} status={request.status} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-line bg-white p-5">
              <h2 className="text-2xl font-semibold">{copy.brief}</h2>
              <dl className="mt-5 grid gap-4 text-sm leading-6 md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-muted">{copy.contactMethod}</dt>
                  <dd>
                    {getContactMethodLabel(request.contactMethod, locale)}:{" "}
                    {request.contactValue}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted">{copy.desiredDeadline}</dt>
                  <dd>{request.desiredDeadline || copy.notSpecified}</dd>
                </div>
              </dl>
              <div className="mt-5 border border-line bg-paper p-4">
                {acceptedContract ? (
                  <dl className="grid gap-3 text-sm leading-6 md:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-muted">{copy.finalPrice}</dt>
                      <dd className="font-semibold">
                        {formatRubles(acceptedContract.finalPrice, locale)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-muted">{copy.completionTime}</dt>
                      <dd className="font-semibold">
                        {formatDurationRange(
                          acceptedContract.finalDurationDays,
                          acceptedContract.finalDurationDays,
                          locale
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <OrderEstimateBreakdown locale={locale} request={request} />
                )}
              </div>
              <div className="mt-6 grid gap-5 text-sm leading-6">
                <section>
                  <h3 className="font-semibold">{copy.expectedResult}</h3>
                  <p className="mt-2 text-muted">{request.resultDescription || request.comment}</p>
                </section>
                <section>
                  <h3 className="font-semibold">{copy.style}</h3>
                  <p className="mt-2 text-muted">
                    {request.stylePreferences || copy.notSpecified}
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold">{copy.materials}</h3>
                  <p className="mt-2 text-muted">{request.materials || copy.notSpecified}</p>
                </section>
                {request.selectedAddons.length ? (
                  <section>
                    <h3 className="font-semibold">{copy.addons}</h3>
                    <ul className="mt-2 grid gap-2 text-muted">
                      {request.selectedAddons.map((addon) => (
                        <li key={addon.id}>
                          {addon.title}: +{formatRubles(addon.price, locale)}
                          {addon.durationDays
                            ? `, +${formatDurationRange(
                                addon.durationDays,
                                addon.durationDays,
                                locale
                              )}`
                            : ""}
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
                    <h2 className="text-2xl font-semibold">{copy.terms}</h2>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-muted">{copy.price}</dt>
                    <dd className="font-semibold">
                      {formatRubles(visibleContract.finalPrice, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">{copy.timing}</dt>
                    <dd className="font-semibold">
                      {formatDurationRange(
                        visibleContract.finalDurationDays,
                        visibleContract.finalDurationDays,
                        locale
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 text-sm leading-6">
                  <h3 className="font-semibold">{copy.task}</h3>
                  <p className="mt-2">{visibleContractWorkScope}</p>
                </div>
                {visibleContract.status === "sent" ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <form action={acceptOrderContractAction}>
                      <input name="requestId" type="hidden" value={request.id} />
                      <input name="contractId" type="hidden" value={visibleContract.id} />
                      <FormSubmitButton
                        className="focus-ring inline-flex min-h-11 w-full items-center justify-center border border-cobalt bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-cobalt active:translate-y-px"
                        idleLabel={copy.accept}
                        pendingLabel={copy.accepting}
                      />
                    </form>
                    <OrderRevisionModal
                      contractId={visibleContract.id}
                      locale={locale}
                      requestId={request.id}
                    />
                  </div>
                ) : null}
                {shouldShowContractFeedback ? (
                  <ContractFeedbackThread
                    feedback={visibleContract.feedback}
                    locale={locale}
                    viewer="client"
                  />
                ) : null}
                {canCommentOnContract ? (
                  <form action={saveClientOrderContractFeedbackAction} className="mt-5 grid gap-3 border border-line bg-white p-4">
                    <input name="requestId" type="hidden" value={request.id} />
                    <input name="contractId" type="hidden" value={visibleContract.id} />
                    <label className="text-sm font-semibold" htmlFor="client-order-comment">
                      {copy.messageDesigner}
                    </label>
                    <textarea
                      className="min-h-28 w-full border border-line bg-white px-3 py-2 text-sm leading-6"
                      id="client-order-comment"
                      maxLength={1000}
                      minLength={10}
                      name="message"
                      placeholder={copy.messagePlaceholder}
                      required
                    />
                    <p className="text-xs text-muted">{copy.characterHint}</p>
                    <FormSubmitButton
                      className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                      idleLabel={copy.sendMessage}
                      pendingLabel={copy.sending}
                    />
                  </form>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="border border-line bg-white p-5">
              <h2 className="text-xl font-semibold">{copy.materials}</h2>
              {attachments.length ? (
                <ul className="mt-4 grid gap-3 text-sm leading-6">
                  {attachments.map((attachment) => (
                    <li className="border border-line bg-paper p-3" key={attachment.id}>
                      <p className="font-semibold">{attachment.fileName}</p>
                      <p className="mt-1 text-muted">
                        {formatBytes(attachment.size, locale)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachment.signedUrl ? (
                          <a
                            className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink"
                            download={attachment.fileName}
                            href={attachment.signedUrl}
                          >
                            {copy.download}
                          </a>
                        ) : null}
                        {canManageAttachments ? (
                          <form action={deleteClientOrderAttachmentAction}>
                            <input name="attachmentId" type="hidden" value={attachment.id} />
                            <input name="requestId" type="hidden" value={request.id} />
                            <ConfirmSubmitButton
                              className="focus-ring inline-flex min-h-10 items-center justify-center border border-accent bg-white px-3 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white"
                              message={
                                locale === "en"
                                  ? `Delete “${attachment.fileName}”?`
                                  : `Удалить файл «${attachment.fileName}»?`
                              }
                            >
                              {copy.delete}
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted">{copy.noMaterials}</p>
              )}

              {canUploadAttachments ? (
                <form action={uploadClientOrderAttachmentAction} className="mt-5 grid gap-3">
                  <input name="requestId" type="hidden" value={request.id} />
                  <label className="text-sm font-semibold" htmlFor="account-request-attachments">
                    {copy.addMaterials}
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
                    {locale === "en"
                      ? `You can add ${MAX_ORDER_ATTACHMENT_COUNT - attachments.length} more file(s).`
                      : `Можно добавить ещё ${MAX_ORDER_ATTACHMENT_COUNT - attachments.length} файл(ов).`}
                  </p>
                  <FormSubmitButton
                    className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                    idleLabel={copy.addMaterials}
                    pendingLabel={copy.upload}
                  />
                </form>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted">
                  {copy.attachmentClosed}
                </p>
              )}
            </section>

            <section className="border border-line bg-paper p-5">
              <h2 className="text-xl font-semibold">{copy.history}</h2>
              <ol className="mt-4 grid gap-3 text-sm leading-6">
                {timeline.map((event, index) => (
                  <li className={`border-l-2 pl-3 ${index === 0 ? "border-accent" : "border-cobalt/30"}`} key={event.id}>
                    <time
                      className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                      dateTime={event.createdAt}
                    >
                      {new Date(event.createdAt).toLocaleString(
                        locale === "en" ? "en-US" : "ru-RU"
                      )}
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
