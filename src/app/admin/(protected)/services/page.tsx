import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { AdminServiceOrderForm } from "@/components/admin-service-order-form";
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
        <input name="displayOrder" type="hidden" value={service?.displayOrder ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название">
            <input className={inputClass} defaultValue={service?.title} name="title" placeholder="Айдентика бренда" />
          </Field>
          <Field
            label="Адрес в ссылке"
            hint="Можно оставить пустым: адрес создастся автоматически из названия"
          >
            <input className={inputClass} defaultValue={service?.slug} name="slug" placeholder="brand-identity" />
          </Field>
        </div>
        <Field label="Краткое описание" hint="Один-два предложения для карточки услуги">
          <textarea
            className={textareaClass}
            defaultValue={service?.description}
            name="description"
            placeholder="Кратко опишите результат и задачи, для которых подходит услуга"
          />
        </Field>
        <Field label="Состав работы" hint="Дополнительные условия, состав работ или важные ограничения">
          <textarea
            className={textareaClass}
            defaultValue={service?.details}
            name="details"
            placeholder="Например: логотип, палитра, шрифтовая пара, правила применения"
          />
        </Field>
        <div className="grid gap-3 border border-line bg-paper p-4">
          <p className="text-sm font-semibold text-ink">Положение в списке</p>
          <p className="text-sm leading-6 text-muted">
            Порядок услуг меняется перетаскиванием в списке ниже. Новая услуга добавится в конец списка
          </p>
          <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
            <input defaultChecked={service?.isActive ?? true} name="isActive" type="checkbox" />
            Показывать на сайте
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
      <AdminCard title="Новая услуга" description="Услуги видны на публичной странице и используются в фильтре портфолио">
        <ServiceForm canWrite={admin.canWrite} />
      </AdminCard>
      <AdminCard title="Порядок на сайте" description="Перетащите услуги в нужной последовательности и сохраните порядок">
        <AdminServiceOrderForm canWrite={admin.canWrite} services={services} />
      </AdminCard>
      <div className="space-y-4">
        {services.map((service) => (
          <AdminCard key={service.id} title={service.title} description={service.slug}>
            <p className="text-sm leading-6 text-muted">{service.description}</p>
            <details className="mt-4">
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
