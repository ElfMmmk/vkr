import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { savePageAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminPages } from "@/lib/data/admin";

export default async function AdminPagesPage() {
  const admin = await requireAdmin();
  const pages = await listAdminPages();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Тексты сайта</p>
        <h1 className="mt-2 text-4xl font-semibold">Страницы</h1>
      </div>
      <div className="space-y-4">
        {pages.map((page) => (
          <AdminCard key={page.pageKey} title={page.title} description={page.pageKey}>
            <form action={savePageAction} className="grid gap-4">
              <AdminFormFieldset canWrite={admin.canWrite}>
                <input name="pageKey" type="hidden" value={page.pageKey} />
                <Field label="Заголовок">
                  <input className={inputClass} defaultValue={page.title} name="title" />
                </Field>
                <Field label="Основной текст">
                  <textarea className={textareaClass} defaultValue={page.body} name="body" />
                </Field>
                <Field label="Дополнительные блоки JSON" hint='Например: {"email":"designer@example.com"}'>
                  <textarea
                    className={`${textareaClass} font-mono text-xs`}
                    defaultValue={JSON.stringify(page.blocks, null, 2)}
                    name="blocks"
                  />
                </Field>
                <button className={adminPrimaryButtonClass}>Сохранить страницу</button>
              </AdminFormFieldset>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
