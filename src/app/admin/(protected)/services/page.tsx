import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { deleteServiceAction, saveServiceAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminServices } from "@/lib/data/admin";
import type { Service } from "@/lib/types";

function ServiceForm({ service, canWrite }: { service?: Service; canWrite: boolean }) {
  return (
    <form action={saveServiceAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={service?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название">
            <input className={inputClass} defaultValue={service?.title} name="title" />
          </Field>
          <Field label="Slug">
            <input className={inputClass} defaultValue={service?.slug} name="slug" />
          </Field>
        </div>
        <Field label="Описание">
          <textarea className={textareaClass} defaultValue={service?.description} name="description" />
        </Field>
        <Field label="Детали">
          <textarea className={textareaClass} defaultValue={service?.details} name="details" />
        </Field>
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <Field label="Порядок вывода">
            <input
              className={inputClass}
              defaultValue={service?.displayOrder ?? 100}
              name="displayOrder"
              type="number"
            />
          </Field>
          <label className="flex items-center gap-3 self-end border border-line bg-white px-4 py-3 text-sm font-semibold">
            <input defaultChecked={service?.isActive ?? true} name="isActive" type="checkbox" />
            Активна
          </label>
        </div>
        <button className={adminPrimaryButtonClass}>
          {service ? "Сохранить услугу" : "Создать услугу"}
        </button>
      </AdminFormFieldset>
    </form>
  );
}

export default async function AdminServicesPage() {
  const admin = await requireAdmin();
  const services = await listAdminServices();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Контент</p>
        <h1 className="mt-2 text-4xl font-semibold">Услуги</h1>
      </div>
      <AdminCard title="Новая услуга" description="Услуги видны на публичной странице и используются в фильтре портфолио.">
        <ServiceForm canWrite={admin.canWrite} />
      </AdminCard>
      <div className="space-y-4">
        {services.map((service) => (
          <AdminCard key={service.id} title={service.title} description={service.slug}>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-accent">Редактировать</summary>
              <div className="mt-5">
                <ServiceForm canWrite={admin.canWrite} service={service} />
              </div>
            </details>
            <form action={deleteServiceAction} className="mt-4">
              <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                <input name="id" type="hidden" value={service.id} />
                <button className={adminDangerButtonClass}>Удалить</button>
              </AdminFormFieldset>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
