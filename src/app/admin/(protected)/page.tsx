import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import { requireAdmin } from "@/lib/auth";
import {
  listAdminPages,
  listAdminProjects,
  listAdminRequests,
  listAdminServices,
  listAdminTags
} from "@/lib/data/admin";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const [pages, projects, services, tags, requests] = await Promise.all([
    listAdminPages(),
    listAdminProjects(),
    listAdminServices(),
    listAdminTags(),
    listAdminRequests()
  ]);
  const publishedProjects = projects.filter((project) => project.isPublished).length;
  const featuredProjects = projects.filter((project) => project.isFeatured).length;
  const activeServices = services.filter((service) => service.isActive).length;
  const newRequests = requests.filter((request) => request.status === "new").length;
  const canBrowseContent = admin.canManageContent;
  const canBrowseRequests = admin.canManageRequests;
  const isManager = admin.role === "manager";

  const cards = [
    { href: "/admin/projects", label: "Проекты", value: projects.length, meta: `${publishedProjects} опубликовано` },
    { href: "/admin/services", label: "Услуги", value: services.length, meta: `${activeServices} на сайте` },
    { href: "/admin/tags", label: "Теги", value: tags.length, meta: "Фильтры портфолио" },
    { href: "/admin/requests", label: "Заявки", value: requests.length, meta: `${newRequests} новых` },
    { href: "/admin/pages", label: "Страницы", value: pages.length, meta: "Тексты сайта" }
  ];

  const visibleCards = cards.filter((card) =>
    card.href === "/admin/requests" ? canBrowseRequests : canBrowseContent
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Панель управления</p>
        <h1 className="mt-2 text-4xl font-semibold">
          {admin.role === "manager" ? "Работа с заказами" : "Обзор контента"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          {isManager
            ? "Здесь собраны новые обращения, заказы и уведомления, доступные менеджеру."
            : "Здесь собраны материалы сайта, пользователи, обращения и основные показатели."}
        </p>
      </div>
      {params.notice === "content-access-denied" ? (
        <div
          className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent"
          role="status"
        >
          Недостаточно прав для этого раздела. Для вашей роли доступны заказы, уведомления и аналитика.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-5">
        {visibleCards.map((card) => (
          <Link
            className="focus-ring min-w-0 border border-line bg-white p-5 transition hover:border-ink hover:bg-paper active:translate-y-px"
            href={card.href}
            key={card.href}
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{card.meta}</p>
          </Link>
        ))}
      </div>
      {canBrowseContent ? (
        <AdminCard title="Состояние витрины">
          <div className="grid gap-4 text-sm leading-6 text-muted md:grid-cols-3">
            <div className="border border-line bg-paper p-4">
              <p className="font-semibold text-ink">Закреплённые кейсы</p>
              <p className="mt-2">{featuredProjects} из 6 мест занято</p>
            </div>
            <div className="border border-line bg-paper p-4">
              <p className="font-semibold text-ink">Активные услуги</p>
              <p className="mt-2">Порядок на сайте совпадает со списком в панели администратора</p>
            </div>
            <div className="border border-line bg-paper p-4">
              <p className="font-semibold text-ink">Новые заявки</p>
              <p className="mt-2">{newRequests ? "Требуют обработки" : "Новых заявок нет"}</p>
            </div>
          </div>
        </AdminCard>
      ) : null}
    </div>
  );
}
