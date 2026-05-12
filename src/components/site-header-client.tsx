"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { dictionaries, type Locale } from "@/lib/i18n";

const navItems = [
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/services", key: "services" },
  { href: "/contacts", key: "contacts" },
  { href: "/account", key: "account" }
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeaderClient({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const dictionary = dictionaries[locale];

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/88 backdrop-blur">
      <a
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        href="#main-content"
      >
        {locale === "en" ? "Skip to content" : "К содержанию"}
      </a>
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
                {dictionary.nav[item.key]}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:block">
          <LocaleSwitcher locale={locale} />
        </div>
        <Link
          aria-current={pathname === "/order" ? "page" : undefined}
          className={`focus-ring inline-flex min-h-11 items-center justify-center border px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:bg-accent hover:text-white active:translate-y-px active:border-ink active:bg-ink sm:px-5 sm:py-3 ${
            pathname === "/order"
              ? "border-accent bg-accent text-white"
              : "border-ink bg-ink text-white"
          }`}
          href="/order"
        >
          {dictionary.nav.order}
        </Link>
        <details className="group w-full md:hidden">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink active:translate-y-px [&::-webkit-details-marker]:hidden">
            <span>{dictionary.nav.navigation}</span>
            <Menu aria-hidden="true" size={18} />
          </summary>
          <nav className="mt-2 grid border border-line bg-white text-sm font-medium text-muted">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring border-b border-line px-4 py-3 transition hover:bg-paper hover:text-ink active:bg-line/40 ${
                    active ? "bg-paper text-ink" : ""
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {dictionary.nav[item.key]}
                </Link>
              );
            })}
            <div className="border-t border-line px-4 py-3">
              <LocaleSwitcher locale={locale} />
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
