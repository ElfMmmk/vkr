import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { AdminRequestStatusForm } from "@/components/admin-request-status-form";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import { FormSubmitButton } from "@/components/form-submit-button";
import { saveOrderContractAction } from "@/lib/actions/admin";
import { requireRequestManager } from "@/lib/auth";
import { getAdminRequestById } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";
import { createOrderAttachmentSignedUrls } from "@/lib/order-attachment-storage";
import { formatDurationRange, formatPriceRange, formatRubles } from "@/lib/order-calculator";
import { requestStatusLabels } from "@/lib/request-status";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";

type AdminRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

const contractStatusLabels = {
  draft: "Черновик",
  sent: "Отправлен клиенту",
  revision_requested: "Клиент запросил изменения",
  accepted: "Принят клиентом",
  cancelled: "Отменён"
} as const;

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
            </dl>
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
                  <h2 className="font-semibold">Доплаты</h2>
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
                      <li key={attachment.id}>
                        {attachment.signedUrl ? (
                          <a className="font-semibold text-accent hover:text-ink" href={attachment.signedUrl}>
                            {attachment.fileName}
                          </a>
                        ) : (
                          <span className="font-semibold">{attachment.fileName}</span>
                        )}
                        <span> · {Math.max(1, Math.round(attachment.size / 1024))} КБ</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard
            title="Договор-заказ"
            description="Финальные условия, которые клиент увидит в личном кабинете."
          >
            <form action={saveOrderContractAction} className="grid gap-4">
              <AdminFormFieldset canWrite={canEditContract}>
                <input name="id" type="hidden" value={contract?.id ?? ""} />
                <input name="requestId" type="hidden" value={request.id} />
                <div className="grid gap-4 md:grid-cols-3">
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
                  <Field label="Статус договора">
                    <select
                      className={selectClass}
                      defaultValue={contract?.status ?? "draft"}
                      name="status"
                    >
                      <option value="draft">Черновик</option>
                      <option value="sent">Отправить клиенту</option>
                      <option disabled value="revision_requested">Клиент запросил изменения</option>
                      <option disabled value="accepted">Принят клиентом</option>
                      <option value="cancelled">Отменён</option>
                    </select>
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
                <Field label="Комментарий менеджера">
                  <textarea
                    className={textareaClass}
                    defaultValue={contract?.managerComment ?? ""}
                    maxLength={fieldLimits.orderContract.managerComment.max}
                    name="managerComment"
                  />
                </Field>
                {contractIsAccepted ? (
                  <p className="border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                    Редактирование недоступно. Клиент принял договор-заказ.
                    {contract.acceptedAt ? ` Время согласования: ${new Date(contract.acceptedAt).toLocaleString("ru-RU")}.` : ""}
                  </p>
                ) : null}
                <FormSubmitButton
                  className={adminPrimaryButtonClass}
                  idleLabel="Сохранить договор-заказ"
                  pendingLabel="Сохранение..."
                />
              </AdminFormFieldset>
            </form>
            {contract?.feedback.length ? (
              <section className="mt-6 border-t border-line pt-5">
                <h3 className="text-lg font-semibold">История комментариев клиента</h3>
                <ol className="mt-3 grid gap-3">
                  {contract.feedback.map((item) => (
                    <li className="border border-line bg-paper p-3 text-sm leading-6" key={item.id}>
                      <p>{item.message}</p>
                      <time className="mt-2 block text-xs text-muted" dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </time>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </AdminCard>
        </div>

        <AdminCard title="Обработка">
          <AdminRequestStatusForm
            canWrite={admin.canManageRequests}
            id={request.id}
            redirectTo={`/admin/requests/${request.id}`}
            status={request.status}
          />
          {contract ? (
            <p className="mt-4 border border-line bg-paper p-3 text-sm leading-6 text-muted">
              Договор: {contractStatusLabels[contract.status]}
            </p>
          ) : null}
        </AdminCard>
      </div>
    </div>
  );
}
