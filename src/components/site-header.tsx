import Link from "next/link";

const navItems = [
  { href: "/about", label: "Обо мне" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/services", label: "Услуги" },
  { href: "/contacts", label: "Контакты" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/88 backdrop-blur">
      <div className="container-shell flex min-h-20 items-center justify-between gap-6 py-4">
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
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          {navItems.map((item) => (
            <Link className="transition hover:text-ink focus-ring" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          className="focus-ring inline-flex items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          href="/order"
        >
          Оставить заявку
        </Link>
      </div>
    </header>
  );
}
