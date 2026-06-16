import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { AdminServiceOrderForm } from "@/components/admin-service-order-form";
import { AdminServiceItemOrderForm } from "@/components/admin-service-item-order-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import { quizQuestionOptions } from "@/components/order/order-form-config";
import { ChevronDown } from "lucide-react";
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
import type { OrderQuizAnswers } from "@/lib/order-quiz";
import { formatPackageIncludedItems } from "@/lib/service-package-marketing";
import type { Service, ServiceAddon, ServicePackage } from "@/lib/types";

type QuizOption = {
  label: string;
  value: OrderQuizAnswers[keyof OrderQuizAnswers];
};

const packageRecommendationLabels: Record<keyof OrderQuizAnswers, string> = {
  goal: "Цель",
  materials: "Материалы",
  scope: "Объём",
  taskType: "Тип задачи",
  urgency: "Срок"
};

const packageRecommendationEntries = Object.entries(quizQuestionOptions) as Array<
  [keyof OrderQuizAnswers, readonly QuizOption[]]
>;

function packageHasRecommendationTags(packageItem: ServicePackage): boolean {
  return packageRecommendationEntries.some(
    ([key]) => (packageItem.recommendationTags[key]?.length ?? 0) > 0
  );
}

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
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input defaultChecked={service?.isActive ?? true} name="isActive" type="checkbox" />
          Отображать
        </label>
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
  function recommendationTagIsChecked(
    key: keyof OrderQuizAnswers,
    value: OrderQuizAnswers[keyof OrderQuizAnswers]
  ): boolean {
    return (packageItem?.recommendationTags[key] as readonly string[] | undefined)?.includes(value) ?? false;
  }

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
        <label className="flex items-center gap-3 bg-paper px-4 py-3 text-sm font-semibold">
          <input defaultChecked={packageItem?.isRecommended ?? false} name="isRecommended" type="checkbox" />
          Рекомендованный пакет
        </label>
        <div className="grid gap-4 bg-paper p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Правила подбора помощника</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Отметьте ответы помощника, для которых подходит этот пакет. Пустой блок не ограничивает подбор.
            </p>
          </div>
          {packageRecommendationEntries.map(([key, options]) => (
            <div
              className="grid gap-2 md:grid-cols-[150px_minmax(0,1fr)] md:items-start"
              key={key}
            >
              <p className="pt-2 text-sm font-semibold text-muted">{packageRecommendationLabels[key]}</p>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <label
                    className="inline-flex min-h-9 items-center gap-2 bg-white px-3 py-2 text-sm font-semibold shadow-sm"
                    key={option.value}
                  >
                    <input
                      defaultChecked={recommendationTagIsChecked(key, option.value)}
                      name={`recommendationTags.${key}`}
                      type="checkbox"
                      value={option.value}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input defaultChecked={packageItem?.isActive ?? true} name="isActive" type="checkbox" />
          Отображать
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
        <Field label="Описание дополнительной услуги">
          <LimitedTextarea
            className={textareaClass}
            defaultValue={addon?.description}
            maxLength={fieldLimits.serviceAddon.description.max}
            name="description"
            placeholder="Что добавляется к заказу"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Дополнительная услуга" required>
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
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input defaultChecked={addon?.isActive ?? true} name="isActive" type="checkbox" />
          Отображать
        </label>
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel={addon ? "Сохранить дополнительную услугу" : "Добавить дополнительную услугу"}
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
      <section className="border border-cobalt/25 bg-paper p-5">
        <div className="mb-5 border-b border-line pb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-cobalt">Управление услугами</p>
          <h2 className="mt-2 text-2xl font-semibold">Создание и порядок на сайте</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Эти разделы управляют общей структурой страницы услуг и отделены от редактирования уже созданных услуг.
          </p>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <AdminCard
            title="Новая услуга"
            description="Создайте отдельную услугу для публичной страницы, фильтров портфолио и формы заказа"
            variant="highlight"
          >
            <ServiceForm canWrite={admin.canWrite} />
          </AdminCard>
          <AdminCard
            title="Порядок на сайте"
            description="Перетащите услуги в нужной последовательности и сохраните порядок"
            variant="highlight"
          >
            <AdminServiceOrderForm canWrite={admin.canWrite} services={services} />
          </AdminCard>
        </div>
      </section>
      <section className="space-y-4">
        <div className="border-b border-line pb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Список услуг</p>
          <h2 className="mt-2 text-2xl font-semibold">Редактирование существующих услуг</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Редактируйте уже созданные услуги, их пакеты, дополнительные услуги и видимость на сайте.
          </p>
        </div>
        {services.map((service) => (
          <AdminCard
            collapsible
            key={service.id}
            title={service.title}
            description={`${service.slug} · ${service.description}`}
          >
            <ServiceForm canWrite={admin.canWrite} service={service} />
            <details className="mt-5 border border-line bg-paper">
              <summary className="focus-ring cursor-pointer px-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                Пакеты
              </summary>
              <div className="border-t border-line bg-white p-4">
                <p className="text-sm leading-6 text-muted">
                  Видны клиенту при оформлении заказа. Порядок меняется ниже.
                </p>
                <details className="mt-4 border border-line bg-paper">
                  <summary className="focus-ring cursor-pointer px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    Добавить пакет
                  </summary>
                  <div className="border-t border-line p-4">
                    <PackageForm canWrite={admin.canWrite} serviceId={service.id} />
                  </div>
                </details>
                <AdminServiceItemOrderForm
                  canWrite={admin.canWrite}
                  items={service.packages}
                  kind="package"
                  serviceId={service.id}
                />
                <div className="mt-4 grid gap-3">
                  {service.packages.map((packageItem) => (
                    <details className="border border-line bg-white p-4" key={packageItem.id}>
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{packageItem.title}</span>
                            {packageHasRecommendationTags(packageItem) ? (
                              <span className="bg-cobalt/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cobalt">
                                Подбирается помощником
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-sm text-muted">
                            {formatPriceRange(packageItem.priceFrom, packageItem.priceTo)} ·{" "}
                            {formatDurationRange(packageItem.durationFromDays, packageItem.durationToDays)}
                          </span>
                        </span>
                        <ChevronDown aria-hidden="true" className="details-chevron mt-1 shrink-0 text-muted" size={18} />
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
              </div>
            </details>
            <details className="mt-5 border border-line bg-paper">
              <summary className="focus-ring cursor-pointer px-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                Дополнительные услуги
              </summary>
              <div className="border-t border-line bg-white p-4">
                <p className="text-sm leading-6 text-muted">
                  Клиент может добавить их к выбранному пакету.
                </p>
                <details className="mt-4 border border-line bg-paper">
                  <summary className="focus-ring cursor-pointer px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    Добавить дополнительную услугу
                  </summary>
                  <div className="border-t border-line p-4">
                    <AddonForm canWrite={admin.canWrite} serviceId={service.id} />
                  </div>
                </details>
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
                            <button className={adminDangerButtonClass}>Удалить дополнительную услугу</button>
                          </AdminFormFieldset>
                        </form>
                      </div>
                    </details>
                  ))}
                  {!service.addons.length ? (
                    <p className="text-sm leading-6 text-muted">Дополнительные услуги пока не настроены.</p>
                  ) : null}
                </div>
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
      </section>
    </div>
  );
}
