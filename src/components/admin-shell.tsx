import Link from "next/link";

import { signOutAction } from "@/lib/actions/admin";

const adminNav = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/services", label: "Услуги" },
  { href: "/admin/tags", label: "Теги" },
  { href: "/admin/images", label: "Изображения" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/pages", label: "Страницы" }
];

export function AdminShell({
  email,
  children
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-grid min-h-screen bg-paper">
      <aside className="border-r border-line bg-ink p-6 text-white">
        <Link className="focus-ring block text-2xl font-semibold" href="/admin">
          Admin
        </Link>
        <p className="mt-2 text-sm leading-6 text-white/60">{email}</p>
        <nav className="mt-10 grid gap-2">
          {adminNav.map((item) => (
            <Link
              className="focus-ring border border-white/10 px-3 py-2 text-sm text-white/78 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="mt-8">
          <button className="focus-ring border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:bg-white hover:text-ink">
            Выйти
          </button>
        </form>
      </aside>
      <main className="min-w-0 p-5 md:p-8">{children}</main>
    </div>
  );
}
