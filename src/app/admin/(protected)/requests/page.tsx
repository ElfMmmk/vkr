import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass } from "@/components/admin-form-lock";
import { AdminRequestStatusForm } from "@/components/admin-request-status-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Field, inputClass, selectClass } from "@/components/form-controls";
import { StatusBadge } from "@/components/status-badge";
import { deleteRequestAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminRequests, listAdminServices } from "@/lib/data/admin";
import { requestStatusLabels, requestStatuses } from "@/lib/request-status";

type AdminRequestsPageProps = {
  searchParams: Promise<{
    query?: string;
    serviceId?: string;
    status?: string;
    sort?: string;
  }>;
};

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const [services, requests] = await Promise.all([
    listAdminServices(),
    listAdminRequests({
      query: params.query,
      serviceId: params.serviceId,
      status: params.status,
      sort
    })
  ]);
  const selectedService = services.find((service) => service.id === params.serviceId);
  const activeFilters = [
    params.query ? `Поиск: ${params.query}` : null,
    selectedService ? `Услуга: ${selectedService.title}` : null,
    params.status ? `Статус: ${requestStatusLabels[params.status as keyof typeof requestStatusLabels]}` : null,
    params.sort === "oldest" ? "Сортировка: сначала старые" : null
  ].filter((item): item is string => Boolean(item));
  const hasFilter = activeFilters.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Продажи</p>
        <h1 className="mt-2 text-4xl font-semibold">Заявки</h1>
      </div>
      <AdminCard title="Поиск и фильтр">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_220px_auto]" method="get">
          <Field label="Поиск">
            <input
              className={inputClass}
              defaultValue={params.query}
              name="query"
              placeholder="Имя или контакт"
            />
          </Field>
          <Field label="Услуга">
            <select className={selectClass} defaultValue={params.serviceId ?? ""} name="serviceId">
              <option value="">Все услуги</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Статус">
            <select className={selectClass} defaultValue={params.status ?? ""} name="status">
              <option value="">Все статусы</option>
              {requestStatuses.map((status) => (
                <option key={status} value={status}>
                  {requestStatusLabels[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Сортировка">
            <select className={selectClass} defaultValue={sort} name="sort">
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </Field>
          <button className="focus-ring inline-flex min-h-11 items-center justify-center self-end border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px">
            Применить
          </button>
        </form>
        {hasFilter ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Установлено
            </span>
            {activeFilters.map((filter) => (
              <span className="border border-line bg-paper px-3 py-1.5 text-sm text-ink" key={filter}>
                {filter}
              </span>
            ))}
            <Link
              className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
              href="/admin/requests"
            >
              Сбросить фильтр
            </Link>
          </div>
        ) : null}
      </AdminCard>
      <div className="space-y-4">
        {requests.map((request) => (
          <AdminCard key={request.id} title={request.clientName} description={new Date(request.createdAt).toLocaleString("ru-RU")}>
            <div className="grid gap-5 md:grid-cols-[1fr_280px]">
              <div className="space-y-3 text-sm leading-6">
                <StatusBadge status={request.status} />
                <p>
                  <span className="font-semibold">Контакт:</span> {request.contactMethod}, {request.contactValue}
                </p>
                <p>
                  <span className="font-semibold">Услуга:</span> {request.serviceTitle || "Не выбрана"}
                </p>
                <p className="text-muted">{request.comment}</p>
              </div>
              <div className="space-y-3">
                <AdminRequestStatusForm canWrite={admin.canWrite} id={request.id} status={request.status} />
                <form action={deleteRequestAction}>
                  <AdminFormFieldset canWrite={admin.canWrite} className="grid">
                    <input name="id" type="hidden" value={request.id} />
                    <ConfirmSubmitButton
                      className={`${adminDangerButtonClass} w-full`}
                      message="Подтвердите удаление заявки. Это действие нельзя отменить."
                    >
                      Удалить заявку
                    </ConfirmSubmitButton>
                  </AdminFormFieldset>
                </form>
              </div>
            </div>
          </AdminCard>
        ))}
        {!requests.length ? (
          <AdminCard title="Заявки не найдены">
            <p className="text-sm text-muted">Измените фильтр или дождитесь новых обращений</p>
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}
