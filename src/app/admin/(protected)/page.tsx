import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import {
  listAdminPages,
  listAdminProjects,
  listAdminRequests,
  listAdminServices,
  listAdminTags
} from "@/lib/data/admin";

export default async function AdminDashboardPage() {
  const [pages, projects, services, tags, requests] = await Promise.all([
    listAdminPages(),
    listAdminProjects(),
    listAdminServices(),
    listAdminTags(),
    listAdminRequests()
  ]);

  const cards = [
    { href: "/admin/projects", label: "Проекты", value: projects.length },
    { href: "/admin/services", label: "Услуги", value: services.length },
    { href: "/admin/tags", label: "Теги", value: tags.length },
    { href: "/admin/requests", label: "Заявки", value: requests.length },
    { href: "/admin/pages", label: "Страницы", value: pages.length }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Панель управления</p>
        <h1 className="mt-2 text-4xl font-semibold">Обзор контента</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {cards.map((card) => (
          <Link
            className="focus-ring border border-line bg-white p-5 transition hover:border-ink"
            href={card.href}
            key={card.href}
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>
      <AdminCard title="Рабочий сценарий">
        <ol className="grid gap-3 text-sm leading-6 text-muted md:grid-cols-3">
          <li>1. Обновите тексты страниц и список услуг.</li>
          <li>2. Добавьте проекты, теги и изображения портфолио.</li>
          <li>3. Обрабатывайте заявки и меняйте их статусы.</li>
        </ol>
      </AdminCard>
    </div>
  );
}
