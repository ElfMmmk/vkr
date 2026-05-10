import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Graphic Designer</p>
          <p className="mt-3 max-w-xl text-2xl font-semibold leading-tight">
            Визуальные системы, которые помогают проектам выглядеть собранно и уверенно.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4 text-sm text-muted md:justify-end">
          <Link className="hover:text-ink" href="/portfolio">
            Портфолио
          </Link>
          <Link className="hover:text-ink" href="/services">
            Услуги
          </Link>
          <Link className="hover:text-ink" href="/contacts">
            Контакты
          </Link>
          <Link className="hover:text-ink" href="/admin/login">
            Админка
          </Link>
        </div>
      </div>
    </footer>
  );
}
