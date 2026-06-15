import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCard } from "@/components/admin-card";
import {
  AdminFormFieldset,
  adminDangerButtonClass,
  adminPrimaryButtonClass
} from "@/components/admin-form-lock";
import { AdminRequestStatusForm } from "@/components/admin-request-status-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ContractFeedbackThread } from "@/components/contract-feedback-thread";
import { ContractStatusBadge } from "@/components/contract-status-badge";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { FormSubmitButton } from "@/components/form-submit-button";
import { OrderEstimateBreakdown } from "@/components/order-estimate-breakdown";
import {
  deleteOrderAttachmentAction,
  saveOrderContractAction,
  saveOrderContractFeedbackAction
} from "@/lib/actions/admin";
import { requireRequestManager } from "@/lib/auth";
import { getAdminRequestById } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";
import { createOrderAttachmentSignedUrls } from "@/lib/order-attachment-storage";
import { formatRubles } from "@/lib/order-calculator";
import { requestStatusLabels } from "@/lib/request-status";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";

type AdminRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRequestDetailPage({ params }: AdminRequestDetailPageProps) {
  const admin = await requireRequestManager();
  const { id } = await params;
  const request = await getAdminRequestById(id);

  if (!request) {
    notFound();
  }

  const contract = request.contract;
  const contractIsAccepted = contract?.status === "accepted";
  const canEditContract = admin.canManageRequests && !contractIsAccepted;
  const finalPrice = contract?.finalPrice ?? request.estimatedPriceTo ?? request.estimatedPriceFrom ?? 0;
  const finalDuration =
    contract?.finalDurationDays ??
    request.estimatedDurationToDays ??
    request.estimatedDurationFromDays ??
    1;
  const attachments = await createOrderAttachmentSignedUrls(
    getSupabaseAdminOrThrow(),
    request.attachments
  );

  return (
    <div className="space-y-6">
      <div>
        <Link className="text-sm font-semibold text-accent hover:text-ink" href="/admin/requests">
          ← К списку заказов
        </Link>
        <p className="mt-4 text-sm uppercase tracking-[0.18em] text-muted">Заказ клиента</p>
        <h1 className="mt-2 text-4xl font-semibold">{request.clientName}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminCard title="Бриф и предварительный расчет">
            <dl className="grid gap-4 text-sm leading-6 md:grid-cols-2">
              <div>
                <dt className="font-semibold text-muted">Контакт</dt>
                <dd>
                  {request.contactMethod}, {request.contactValue}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted">Статус</dt>
                <dd>{requestStatusLabels[request.status]}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted">Услуга</dt>
                <dd>{request.serviceTitle || "Не выбрана"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted">Пакет</dt>
                <dd>{request.packageTitle || "Не выбран"}</dd>
              </div>
            </dl>
            <div className="mt-5 border border-line bg-paper p-4">
              <OrderEstimateBreakdown request={request} />
            </div>
            <div className="mt-6 grid gap-5 text-sm leading-6">
              <section>
                <h2 className="font-semibold">Ожидаемый результат</h2>
                <p className="mt-2 text-muted">{request.resultDescription || request.comment}</p>
              </section>
              <section>
                <h2 className="font-semibold">Стиль и ориентиры</h2>
                <p className="mt-2 text-muted">{request.stylePreferences || "Не указано"}</p>
              </section>
              <section>
                <h2 className="font-semibold">Материалы</h2>
                <p className="mt-2 text-muted">{request.materials || "Не указано"}</p>
              </section>
              <section>
                <h2 className="font-semibold">Желаемый срок</h2>
                <p className="mt-2 text-muted">{request.desiredDeadline || "Не указан"}</p>
              </section>
              {request.referenceProjectTitle ? (
                <section>
                  <h2 className="font-semibold">Пример работы</h2>
                  <p className="mt-2 text-muted">
                    {request.referenceProjectTitle}
                    {request.referenceProjectSlug ? ` (${request.referenceProjectSlug})` : ""}
                  </p>
                </section>
              ) : null}
              {request.selectedAddons.length ? (
                <section>
                  <h2 className="font-semibold">Выбранные доплаты</h2>
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
              {attachments.length ? (
                <section>
                  <h2 className="font-semibold">Материалы клиента</h2>
                  <ul className="mt-2 grid gap-2 text-muted">
                    {attachments.map((attachment) => (
                      <li
                        className="flex flex-col gap-3 border border-line bg-paper p-3 sm:flex-row sm:items-center sm:justify-between"
                        key={attachment.id}
                      >
                        <span>
                          <span className="font-semibold text-ink">{attachment.fileName}</span>
                          <span> · {Math.max(1, Math.round(attachment.size / 1024))} КБ</span>
                        </span>
                        <span className="flex flex-wrap gap-2">
                          {attachment.signedUrl ? (
                            <a
                              className="focus-ring inline-flex min-h-10 items-center justify-center border border-ink bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-white"
                              download={attachment.fileName}
                              href={attachment.signedUrl}
                            >
                              Скачать
                            </a>
                          ) : null}
                          <form action={deleteOrderAttachmentAction}>
                            <input name="attachmentId" type="hidden" value={attachment.id} />
                            <input name="requestId" type="hidden" value={request.id} />
                            <ConfirmSubmitButton
                              className={adminDangerButtonClass}
                              message={`Удалить файл «${attachment.fileName}»?`}
                            >
                              Удалить
                            </ConfirmSubmitButton>
                          </form>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard
            title="Заказ"
            description="Финальные условия, которые клиент увидит в личном кабинете."
          >
            <div className="mb-5">
              <ContractStatusBadge status={contract?.status} />
            </div>
            <form action={saveOrderContractAction} className="grid gap-4">
              <AdminFormFieldset canWrite={canEditContract}>
                <input name="id" type="hidden" value={contract?.id ?? ""} />
                <input name="requestId" type="hidden" value={request.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Финальная цена" required>
                    <input
                      className={inputClass}
                      defaultValue={finalPrice}
                      max={fieldLimits.orderContract.finalPrice.max}
                      min={fieldLimits.orderContract.finalPrice.min}
                      name="finalPrice"
                      required
                      type="number"
                    />
                  </Field>
                  <Field label="Финальный срок, раб. дни" required>
                    <input
                      className={inputClass}
                      defaultValue={finalDuration}
                      max={fieldLimits.orderContract.finalDurationDays.max}
                      min={fieldLimits.orderContract.finalDurationDays.min}
                      name="finalDurationDays"
                      required
                      type="number"
                    />
                  </Field>
                </div>
                <Field label="Состав работ" required>
                  <textarea
                    className={textareaClass}
                    defaultValue={
                      contract?.workScope ||
                      request.resultDescription ||
                      request.packageDescription ||
                      request.comment
                    }
                    maxLength={fieldLimits.orderContract.workScope.max}
                    minLength={fieldLimits.orderContract.workScope.min}
                    name="workScope"
                    required
                  />
                </Field>
                <Field label="Материалы и результат">
                  <textarea
                    className={textareaClass}
                    defaultValue={contract?.materials || request.materials}
                    maxLength={fieldLimits.orderContract.materials.max}
                    name="materials"
                  />
                </Field>
                <Field label="Пояснение для клиента">
                  <textarea
                    className={textareaClass}
                    defaultValue={contract?.managerComment ?? ""}
                    maxLength={fieldLimits.orderContract.managerComment.max}
                    name="managerComment"
                  />
                </Field>
                {contractIsAccepted ? (
                  <p className="border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                    Редактирование недоступно. Клиент принял заказ.
                    {contract.acceptedAt ? ` Время согласования: ${new Date(contract.acceptedAt).toLocaleString("ru-RU")}.` : ""}
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormSubmitButton
                    className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper"
                    idleLabel="Сохранить черновик"
                    name="status"
                    pendingLabel="Сохранение..."
                    value="draft"
                  />
                  <FormSubmitButton
                    className={adminPrimaryButtonClass}
                    idleLabel="Отправить на согласование"
                    name="status"
                    pendingLabel="Отправка..."
                    value="sent"
                  />
                </div>
              </AdminFormFieldset>
            </form>
            {contract ? (
              <>
                <ContractFeedbackThread feedback={contract.feedback} viewer="staff" />
                <form
                  action={saveOrderContractFeedbackAction}
                  className="mt-5 grid gap-3 border border-line bg-paper p-4"
                >
                  <AdminFormFieldset canWrite={admin.canManageRequests}>
                    <input name="contractId" type="hidden" value={contract.id} />
                    <input name="requestId" type="hidden" value={request.id} />
                    <Field
                      label={admin.role === "admin" ? "Комментарий администратора" : "Комментарий дизайнера"}
                      hint="Комментарий появится в диалоге с клиентом"
                      required
                    >
                      <textarea
                        className={textareaClass}
                        maxLength={1000}
                        minLength={10}
                        name="message"
                        required
                      />
                    </Field>
                    <FormSubmitButton
                      className={adminPrimaryButtonClass}
                      idleLabel="Отправить комментарий"
                      pendingLabel="Отправка..."
                    />
                  </AdminFormFieldset>
                </form>
              </>
            ) : (
              <p className="mt-5 text-sm text-muted">
                Сначала сохраните заказ, затем можно будет вести диалог с клиентом.
              </p>
            )}
          </AdminCard>
        </div>

        <AdminCard title="Обработка">
          <AdminRequestStatusForm
            canWrite={admin.canManageRequests}
            id={request.id}
            redirectTo={`/admin/requests/${request.id}`}
            status={request.status}
          />
        </AdminCard>
      </div>
    </div>
  );
}
