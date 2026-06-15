import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { AdminServiceOrderForm } from "@/components/admin-service-order-form";
import { AdminServiceItemOrderForm } from "@/components/admin-service-item-order-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import {
  deleteServiceAction,
  deleteServiceAddonAction,
  deleteServicePackageAction,
  saveServiceAction,
  saveServiceAddonAction,
  saveServicePackageAction
} from "@/lib/actions/admin";
import { requireContentAdmin } from "@/lib/auth";
import { listAdminServices } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";
import { formatDurationRange, formatPriceRange, formatRubles } from "@/lib/order-calculator";
import { formatPackageIncludedItems } from "@/lib/service-package-marketing";
import type { Service, ServiceAddon, ServicePackage } from "@/lib/types";

function ServiceForm({ service, canWrite }: { service?: Service; canWrite: boolean }) {
  return (
    <form action={saveServiceAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={service?.id ?? ""} />
        <input name="displayOrder" type="hidden" value={service?.displayOrder ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название" required>
            <LimitedInput
              className={inputClass}
              defaultValue={service?.title}
              maxLength={fieldLimits.service.title.max}
              minLength={fieldLimits.service.title.min}
              name="title"
              placeholder="Айдентика бренда"
              required
            />
          </Field>
          <Field
            label="Адрес в ссылке"
            hint="Можно оставить пустым: адрес создастся автоматически из названия"
          >
            <LimitedInput
              className={inputClass}
              defaultValue={service?.slug}
              maxLength={fieldLimits.service.slug.max}
              minLength={fieldLimits.service.slug.min}
              name="slug"
              placeholder="brand-identity"
            />
          </Field>
        </div>
        <Field label="Краткое описание" hint="Один-два предложения для карточки услуги" required>
          <LimitedTextarea
            className={textareaClass}
            defaultValue={service?.description}
            maxLength={fieldLimits.service.description.max}
            minLength={fieldLimits.service.description.min}
            name="description"
            placeholder="Кратко опишите результат и задачи, для которых подходит услуга"
            required
          />
        </Field>
        <Field label="Состав работы" hint="Дополнительные условия, состав работ или важные ограничения">
          <LimitedTextarea
            className={textareaClass}
            defaultValue={service?.details}
            maxLength={fieldLimits.service.details.max}
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
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel={service ? "Сохранить услугу" : "Создать услугу"}
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
    </form>
  );
}

function PackageForm({
  canWrite,
  packageItem,
  serviceId
}: {
  canWrite: boolean;
  packageItem?: ServicePackage;
  serviceId: string;
}) {
  return (
    <form action={saveServicePackageAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={packageItem?.id ?? ""} />
        <input name="serviceId" type="hidden" value={serviceId} />
        <input name="displayOrder" type="hidden" value={packageItem?.displayOrder ?? ""} />
        <Field label="Название пакета" required>
          <LimitedInput
            className={inputClass}
            defaultValue={packageItem?.title}
            maxLength={fieldLimits.servicePackage.title.max}
            minLength={fieldLimits.servicePackage.title.min}
            name="title"
            placeholder="Базовый пакет"
            required
          />
        </Field>
        <Field label="Описание пакета">
          <LimitedTextarea
            className={textareaClass}
            defaultValue={packageItem?.description}
            maxLength={fieldLimits.servicePackage.description.max}
            name="description"
            placeholder="Что входит в пакет и какой результат получает клиент"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Бейдж">
            <LimitedInput
              className={inputClass}
              defaultValue={packageItem?.badge}
              maxLength={fieldLimits.servicePackage.badge.max}
              name="badge"
              placeholder="Популярный"
            />
          </Field>
          <Field label="Кому подходит">
            <LimitedInput
              className={inputClass}
              defaultValue={packageItem?.bestFor}
              maxLength={fieldLimits.servicePackage.bestFor.max}
              name="bestFor"
              placeholder="Для запуска бренда"
            />
          </Field>
          <Field label="Ожидаемый результат">
            <LimitedInput
              className={inputClass}
              defaultValue={packageItem?.outcome}
              maxLength={fieldLimits.servicePackage.outcome.max}
              name="outcome"
              placeholder="Готовая визуальная система"
            />
          </Field>
        </div>
        <Field label="Что входит" hint="Один пункт на строку, пустые строки будут пропущены">
          <textarea
            className={textareaClass}
            defaultValue={formatPackageIncludedItems(packageItem?.includedItems ?? [])}
            name="includedItems"
            placeholder={"Логотип\nПалитра\nБазовый бренд-гайд"}
            rows={4}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Цена от" required>
            <input
              className={inputClass}
              defaultValue={packageItem?.priceFrom ?? 0}
              max={fieldLimits.servicePackage.price.max}
              min={fieldLimits.servicePackage.price.min}
              name="priceFrom"
              required
              type="number"
            />
          </Field>
          <Field label="Цена до" required>
            <input
              className={inputClass}
              defaultValue={packageItem?.priceTo ?? 0}
              max={fieldLimits.servicePackage.price.max}
              min={fieldLimits.servicePackage.price.min}
              name="priceTo"
              required
              type="number"
            />
          </Field>
          <Field label="Срок от" required>
            <input
              className={inputClass}
              defaultValue={packageItem?.durationFromDays ?? 7}
              max={fieldLimits.servicePackage.durationDays.max}
              min={fieldLimits.servicePackage.durationDays.min}
              name="durationFromDays"
              required
              type="number"
            />
          </Field>
          <Field label="Срок до" required>
            <input
              className={inputClass}
              defaultValue={packageItem?.durationToDays ?? 14}
              max={fieldLimits.servicePackage.durationDays.max}
              min={fieldLimits.servicePackage.durationDays.min}
              name="durationToDays"
              required
              type="number"
            />
          </Field>
        </div>
        <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
          <input defaultChecked={packageItem?.isRecommended ?? false} name="isRecommended" type="checkbox" />
          Рекомендованный пакет
        </label>
        <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
          <input defaultChecked={packageItem?.isActive ?? true} name="isActive" type="checkbox" />
          Показывать пакет клиентам
        </label>
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel={packageItem ? "Сохранить пакет" : "Добавить пакет"}
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
    </form>
  );
}

function AddonForm({
  addon,
  canWrite,
  serviceId
}: {
  addon?: ServiceAddon;
  canWrite: boolean;
  serviceId: string;
}) {
  return (
    <form action={saveServiceAddonAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={addon?.id ?? ""} />
        <input name="serviceId" type="hidden" value={serviceId} />
        <input name="displayOrder" type="hidden" value={addon?.displayOrder ?? ""} />
        <Field label="Название дополнительной услуги" required>
          <LimitedInput
            className={inputClass}
            defaultValue={addon?.title}
            maxLength={fieldLimits.serviceAddon.title.max}
            minLength={fieldLimits.serviceAddon.title.min}
            name="title"
            placeholder="Дополнительная услуга"
            required
          />
        </Field>
        <Field label="Описание доплаты">
          <LimitedTextarea
            className={textareaClass}
            defaultValue={addon?.description}
            maxLength={fieldLimits.serviceAddon.description.max}
            name="description"
            placeholder="Что добавляется к заказу"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Доплата" required>
            <input
              className={inputClass}
              defaultValue={addon?.price ?? 0}
              max={fieldLimits.serviceAddon.price.max}
              min={fieldLimits.serviceAddon.price.min}
              name="price"
              required
              type="number"
            />
          </Field>
          <Field label="Доп. срок, раб. дни">
            <input
              className={inputClass}
              defaultValue={addon?.durationDays ?? 0}
              max={fieldLimits.serviceAddon.durationDays.max}
              min={fieldLimits.serviceAddon.durationDays.min}
              name="durationDays"
              type="number"
            />
          </Field>
        </div>
        <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
          <input defaultChecked={addon?.isActive ?? true} name="isActive" type="checkbox" />
          Показывать доплату клиентам
        </label>
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel={addon ? "Сохранить доплату" : "Добавить доплату"}
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
    </form>
  );
}

export default async function AdminServicesPage() {
  const admin = await requireContentAdmin();
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
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="border border-line bg-paper p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Пакеты</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Видны клиенту при оформлении заказа. Порядок меняется ниже.
                    </p>
                  </div>
                  <details>
                    <summary className="focus-ring cursor-pointer border border-ink bg-ink px-3 py-2 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                      Добавить
                    </summary>
                    <div className="mt-4">
                      <PackageForm canWrite={admin.canWrite} serviceId={service.id} />
                    </div>
                  </details>
                </div>
                <AdminServiceItemOrderForm
                  canWrite={admin.canWrite}
                  items={service.packages}
                  kind="package"
                  serviceId={service.id}
                />
                <div className="mt-4 grid gap-3">
                  {service.packages.map((packageItem) => (
                    <details className="border border-line bg-white p-4" key={packageItem.id}>
                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="block font-semibold">{packageItem.title}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {formatPriceRange(packageItem.priceFrom, packageItem.priceTo)} ·{" "}
                          {formatDurationRange(packageItem.durationFromDays, packageItem.durationToDays)}
                        </span>
                      </summary>
                      <div className="mt-4 border-t border-line pt-4">
                        <PackageForm
                          canWrite={admin.canWrite}
                          packageItem={packageItem}
                          serviceId={service.id}
                        />
                        <form action={deleteServicePackageAction} className="mt-3">
                          <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                            <input name="id" type="hidden" value={packageItem.id} />
                            <button className={adminDangerButtonClass}>Удалить пакет</button>
                          </AdminFormFieldset>
                        </form>
                      </div>
                    </details>
                  ))}
                  {!service.packages.length ? (
                    <p className="text-sm leading-6 text-muted">Пакеты пока не настроены.</p>
                  ) : null}
                </div>
              </section>
              <section className="border border-line bg-paper p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Дополнительные услуги</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Клиент может добавить их к выбранному пакету.
                    </p>
                  </div>
                  <details>
                    <summary className="focus-ring cursor-pointer border border-ink bg-ink px-3 py-2 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                      Добавить
                    </summary>
                    <div className="mt-4">
                      <AddonForm canWrite={admin.canWrite} serviceId={service.id} />
                    </div>
                  </details>
                </div>
                <AdminServiceItemOrderForm
                  canWrite={admin.canWrite}
                  items={service.addons}
                  kind="addon"
                  serviceId={service.id}
                />
                <div className="mt-4 grid gap-3">
                  {service.addons.map((addon) => (
                    <details className="border border-line bg-white p-4" key={addon.id}>
                      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <span className="block font-semibold">{addon.title}</span>
                        <span className="mt-1 block text-sm text-muted">
                          +{formatRubles(addon.price)}
                          {addon.durationDays ? ` · +${addon.durationDays} раб. дн.` : ""}
                        </span>
                      </summary>
                      <div className="mt-4 border-t border-line pt-4">
                        <AddonForm addon={addon} canWrite={admin.canWrite} serviceId={service.id} />
                        <form action={deleteServiceAddonAction} className="mt-3">
                          <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                            <input name="id" type="hidden" value={addon.id} />
                            <button className={adminDangerButtonClass}>Удалить доплату</button>
                          </AdminFormFieldset>
                        </form>
                      </div>
                    </details>
                  ))}
                  {!service.addons.length ? (
                    <p className="text-sm leading-6 text-muted">Доплаты пока не настроены.</p>
                  ) : null}
                </div>
              </section>
            </div>
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
