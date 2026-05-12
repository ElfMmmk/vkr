"use client";

import { setLocaleAction } from "@/app/locale/actions";
import type { Locale } from "@/lib/i18n";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  return (
    <form action={setLocaleAction} aria-label="Language" className="inline-flex border border-line bg-white p-1">
      {(["ru", "en"] as Locale[]).map((item) => (
        <button
          aria-pressed={locale === item}
          className={`focus-ring min-h-9 px-3 text-xs font-semibold uppercase transition ${
            locale === item ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"
          }`}
          key={item}
          name="locale"
          type="submit"
          value={item}
        >
          {item}
        </button>
      ))}
    </form>
  );
}
