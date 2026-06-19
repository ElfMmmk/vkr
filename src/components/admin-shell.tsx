"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  BarChart3,
  Bell,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Tags,
  Users
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { RouteFlashToast } from "@/components/route-flash-toast";
import { signOutAction } from "@/lib/actions/admin";

const adminNav = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, scope: "requests" },
  { href: "/admin/notifications", label: "Уведомления", icon: Bell, scope: "requests" },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3, scope: "requests" },
  { href: "/admin/requests", label: "Заказы", icon: Inbox, scope: "requests" },
  { href: "/admin/users", label: "Пользователи", icon: Users, scope: "roles" },
  { href: "/admin/projects", label: "Проекты", icon: BriefcaseBusiness, scope: "content" },
  { href: "/admin/services", label: "Услуги", icon: Menu, scope: "content" },
  { href: "/admin/tags", label: "Теги", icon: Tags, scope: "content" },
  { href: "/admin/images", label: "Изображения", icon: Images, scope: "content" },
  { href: "/admin/pages", label: "Страницы", icon: FileText, scope: "content" }
];

const roleLabels = {
  admin: "Администратор",
  manager: "Менеджер",
  client: "Клиент"
} as const;

export function AdminShell({
  email,
  role,
  canManageContent,
  canManageRequests,
  canManageRoles,
  children
}: {
  email: string;
  role: "admin" | "manager" | "client";
  canManageContent: boolean;
  canManageRequests: boolean;
  canManageRoles: boolean;
  children: ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visibleNav = adminNav.filter((item) => {
    if (item.scope === "roles") {
      return canManageRoles;
    }

    return item.scope === "content"
      ? canManageContent
      : canManageRequests || canManageContent;
  });

  const renderNav = (collapsed = false) => (
    <nav className="grid gap-2">
      {visibleNav.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className={`focus-ring flex min-h-11 items-center gap-3 border border-white/10 px-3 py-2 text-sm text-white/78 transition hover:border-white/30 hover:bg-white/10 hover:text-white active:bg-white/15 ${
              collapsed ? "justify-center" : ""
            }`}
            href={item.href}
            key={item.href}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
          >
            <Icon aria-hidden="true" size={18} />
            <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div
      className={`min-h-screen bg-paper md:grid ${
        isCollapsed ? "md:grid-cols-[88px_minmax(0,1fr)]" : "md:grid-cols-[260px_minmax(0,1fr)]"
      }`}
    >
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-ink p-5 text-white md:flex md:flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            className={`focus-ring block min-w-0 font-semibold ${
              isCollapsed ? "sr-only" : "text-2xl"
            }`}
            href="/admin"
          >
            Служебная панель
          </Link>
          <button
            aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
            className="focus-ring inline-grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-white/80 transition hover:bg-white hover:text-ink active:translate-y-px"
            onClick={() => setIsCollapsed((current) => !current)}
            type="button"
          >
            {isCollapsed ? <PanelLeftOpen aria-hidden="true" size={17} /> : <PanelLeftClose aria-hidden="true" size={17} />}
          </button>
        </div>
        {!isCollapsed ? (
          <p className="mt-2 truncate text-sm leading-6 text-white/60">
            {email} · {roleLabels[role]}
          </p>
        ) : null}
        <div className="mt-10 flex-1">{renderNav(isCollapsed)}</div>
        <form action={signOutAction} className="mt-8">
          <button
            className={`focus-ring flex min-h-11 w-full items-center gap-3 border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white hover:text-ink active:translate-y-px ${
              isCollapsed ? "justify-center" : ""
            }`}
            aria-label={isCollapsed ? "Выйти" : undefined}
            title={isCollapsed ? "Выйти" : undefined}
          >
            <LogOut aria-hidden="true" size={18} />
            <span className={isCollapsed ? "sr-only" : ""}>Выйти</span>
          </button>
        </form>
      </aside>
      <main id="main-content" className="min-w-0 p-5 md:p-8">
        <div className="mb-5 border border-line bg-ink p-4 text-white md:hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link className="focus-ring block text-2xl font-semibold" href="/admin">
                Служебная панель
              </Link>
              <p className="mt-1 truncate text-sm leading-6 text-white/60">
                {email} · {roleLabels[role]}
              </p>
            </div>
            <form action={signOutAction}>
              <button className="focus-ring inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:bg-white hover:text-ink active:translate-y-px">
                <LogOut aria-hidden="true" size={16} />
                Выйти
              </button>
            </form>
          </div>
          <details className="mt-4">
            <summary className="focus-ring flex cursor-pointer list-none items-center justify-between border border-white/15 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span>Разделы</span>
              <Menu aria-hidden="true" size={18} />
            </summary>
            <div className="mt-2">{renderNav()}</div>
          </details>
        </div>
        <RouteFlashToast />
        {children}
      </main>
    </div>
  );
}
