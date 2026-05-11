"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/about", label: "Обо мне" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/services", label: "Услуги" },
  { href: "/contacts", label: "Контакты" }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/88 backdrop-blur">
      <div className="container-shell flex min-h-20 flex-wrap items-center justify-between gap-3 py-4 md:flex-nowrap md:gap-6">
        <Link className="group flex items-center gap-3 focus-ring" href="/">
          <span className="grid h-11 w-11 place-items-center border border-ink bg-ink text-sm font-semibold text-white">
            GD
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              Portfolio
            </span>
            <span className="block text-lg font-semibold">Graphic Designer</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm font-medium text-muted md:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`focus-ring px-3 py-2 transition hover:text-ink ${
                  active ? "bg-white text-ink shadow-soft" : ""
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          aria-current={pathname === "/order" ? "page" : undefined}
          className={`focus-ring inline-flex min-h-11 items-center justify-center border px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:bg-accent hover:text-white active:translate-y-px active:border-ink active:bg-ink sm:px-5 sm:py-3 ${
            pathname === "/order"
              ? "border-accent bg-accent text-white"
              : "border-ink bg-ink text-white"
          }`}
          href="/order"
        >
          Оставить заявку
        </Link>
        <details className="group w-full md:hidden">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink active:translate-y-px [&::-webkit-details-marker]:hidden">
            <span>Навигация</span>
            <Menu aria-hidden="true" size={18} />
          </summary>
          <nav className="mt-2 grid border border-line bg-white text-sm font-medium text-muted">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring border-b border-line px-4 py-3 transition last:border-b-0 hover:bg-paper hover:text-ink active:bg-line/40 ${
                    active ? "bg-paper text-ink" : ""
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </details>
      </div>
    </header>
  );
}
