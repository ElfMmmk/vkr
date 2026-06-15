import { AdminCard } from "@/components/admin-card";
import { AdminPageForm } from "@/components/admin-page-form";
import { requireContentAdmin } from "@/lib/auth";
import { listAdminPages } from "@/lib/data/admin";
import type { PageKey } from "@/lib/types";

const pageLabels: Record<PageKey, string> = {
  home: "Главная",
  about: "О дизайнере",
  services: "Услуги",
  contacts: "Контакты"
};

const pageDescriptions: Record<PageKey, string> = {
  home: "Текст первого экрана, кнопки и короткие блоки главной страницы",
  about: "Описание опыта, подхода и дополнительных фактов о дизайнере",
  services: "Вводный текст страницы услуг",
  contacts: "Контактные данные и текст страницы контактов"
};

export default async function AdminPagesPage() {
  const admin = await requireContentAdmin();
  const pages = await listAdminPages();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Тексты сайта</p>
        <h1 className="mt-2 text-4xl font-semibold">Страницы</h1>
      </div>
      <div className="space-y-4">
        {pages.map((page) => (
          <AdminCard
            collapsible
            key={page.pageKey}
            title={pageLabels[page.pageKey] ?? page.title}
            description={pageDescriptions[page.pageKey]}
          >
            <AdminPageForm canWrite={admin.canWrite} page={page} />
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
