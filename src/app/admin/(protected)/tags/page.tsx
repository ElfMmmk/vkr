import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import {
  AdminTranslatedFields,
  type AdminTranslatedField
} from "@/components/admin-translated-fields";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass } from "@/components/form-controls";
import { LimitedInput } from "@/components/limited-text-control";
import { deleteTagAction, saveTagAction } from "@/lib/actions/admin";
import { requireContentAdmin } from "@/lib/auth";
import { listAdminTags } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";
import type { Tag } from "@/lib/types";

const tagTextFields: AdminTranslatedField[] = [
  {
    name: "title",
    label: "Название",
    maxLength: fieldLimits.tag.title.max,
    minLength: fieldLimits.tag.title.min,
    placeholder: "Брендинг",
    required: true
  },
  {
    name: "description",
    label: "Описание",
    kind: "textarea",
    maxLength: fieldLimits.tag.description.max,
    placeholder: "Короткое пояснение для внутренней навигации"
  }
];

function TagForm({ tag, canWrite }: { tag?: Tag; canWrite: boolean }) {
  return (
    <form action={saveTagAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={tag?.id ?? ""} />
        <AdminTranslatedFields
          english={tag?.englishTranslation}
          entityType="tag"
          fields={tagTextFields}
          russian={{
            title: tag?.title ?? "",
            description: tag?.description ?? ""
          }}
        />
        <Field
          label="Адрес в ссылке"
          hint="Можно оставить пустым: адрес создастся автоматически из русского названия."
        >
          <LimitedInput
            className={inputClass}
            defaultValue={tag?.slug}
            maxLength={fieldLimits.tag.slug.max}
            minLength={fieldLimits.tag.slug.min}
            name="slug"
            placeholder="branding"
          />
        </Field>
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel={tag ? "Сохранить тег" : "Создать тег"}
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
    </form>
  );
}

export default async function AdminTagsPage() {
  const admin = await requireContentAdmin();
  const tags = await listAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Фильтрация</p>
        <h1 className="mt-2 text-4xl font-semibold">Теги</h1>
      </div>
      <AdminCard title="Новый тег">
        <TagForm canWrite={admin.canWrite} />
      </AdminCard>
      <div className="grid gap-4 md:grid-cols-2">
        {tags.map((tag) => (
          <AdminCard key={tag.id} title={tag.title} description={tag.slug}>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-accent">Редактировать</summary>
              <div className="mt-5">
                <TagForm canWrite={admin.canWrite} tag={tag} />
              </div>
            </details>
            <form action={deleteTagAction} className="mt-4">
              <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                <input name="id" type="hidden" value={tag.id} />
                <button className={adminDangerButtonClass}>Удалить</button>
              </AdminFormFieldset>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
