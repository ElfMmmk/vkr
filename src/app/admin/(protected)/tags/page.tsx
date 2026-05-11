import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import { deleteTagAction, saveTagAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminTags } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";
import type { Tag } from "@/lib/types";

function TagForm({ tag, canWrite }: { tag?: Tag; canWrite: boolean }) {
  return (
    <form action={saveTagAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={tag?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название" required>
            <LimitedInput
              className={inputClass}
              defaultValue={tag?.title}
              maxLength={fieldLimits.tag.title.max}
              minLength={fieldLimits.tag.title.min}
              name="title"
              placeholder="Брендинг"
              required
            />
          </Field>
          <Field
            label="Адрес в ссылке"
            hint="Можно оставить пустым: адрес создастся автоматически из названия."
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
        </div>
        <Field label="Описание">
          <LimitedTextarea
            className={textareaClass}
            defaultValue={tag?.description}
            maxLength={fieldLimits.tag.description.max}
            name="description"
            placeholder="Короткое пояснение для внутренней навигации"
          />
        </Field>
        <button className={adminPrimaryButtonClass}>{tag ? "Сохранить тег" : "Создать тег"}</button>
      </AdminFormFieldset>
    </form>
  );
}

export default async function AdminTagsPage() {
  const admin = await requireAdmin();
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
