import { AdminCard } from "@/components/admin-card";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { deleteTagAction, saveTagAction } from "@/lib/actions/admin";
import { listAdminTags } from "@/lib/data/admin";
import type { Tag } from "@/lib/types";

function TagForm({ tag }: { tag?: Tag }) {
  return (
    <form action={saveTagAction} className="grid gap-4">
      <input name="id" type="hidden" value={tag?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Название">
          <input className={inputClass} defaultValue={tag?.title} name="title" />
        </Field>
        <Field label="Slug">
          <input className={inputClass} defaultValue={tag?.slug} name="slug" />
        </Field>
      </div>
      <Field label="Описание">
        <textarea className={textareaClass} defaultValue={tag?.description} name="description" />
      </Field>
      <button className="focus-ring border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-accent">
        {tag ? "Сохранить тег" : "Создать тег"}
      </button>
    </form>
  );
}

export default async function AdminTagsPage() {
  const tags = await listAdminTags();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Фильтрация</p>
        <h1 className="mt-2 text-4xl font-semibold">Теги</h1>
      </div>
      <AdminCard title="Новый тег">
        <TagForm />
      </AdminCard>
      <div className="grid gap-4 md:grid-cols-2">
        {tags.map((tag) => (
          <AdminCard key={tag.id} title={tag.title} description={tag.slug}>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-accent">Редактировать</summary>
              <div className="mt-5">
                <TagForm tag={tag} />
              </div>
            </details>
            <form action={deleteTagAction} className="mt-4">
              <input name="id" type="hidden" value={tag.id} />
              <button className="focus-ring border border-accent px-3 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white">
                Удалить
              </button>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
