import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export async function SiteFooter() {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Graphic Designer</p>
          <p className="mt-3 max-w-xl text-2xl font-semibold leading-tight">
            {locale === "en"
              ? "Visual systems that help projects look coherent, confident, and ready to use."
              : "Визуальные системы, которые помогают проектам выглядеть собранно и уверенно."}
          </p>
        </div>
        <div className="space-y-5 text-sm text-muted md:text-right">
          <nav
            className="flex flex-wrap items-start gap-4 md:justify-end"
            aria-label={locale === "en" ? "Footer navigation" : "Нижняя навигация"}
          >
            <Link className="hover:text-ink" href="/portfolio">
              {dictionary.nav.portfolio}
            </Link>
            <Link className="hover:text-ink" href="/services">
              {dictionary.nav.services}
            </Link>
            <Link className="hover:text-ink" href="/contacts">
              {dictionary.nav.contacts}
            </Link>
            <Link className="hover:text-ink" href="/privacy">
              {locale === "en" ? "Privacy policy" : "Политика обработки персональных данных"}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
