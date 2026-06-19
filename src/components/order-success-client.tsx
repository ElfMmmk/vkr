"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";
import { ORDER_DRAFT_STORAGE_KEY } from "@/lib/order-draft";

type LastOrderSummary = {
  serviceTitle?: string;
  packageTitle?: string;
  price?: string;
  duration?: string;
  addons?: string[];
  files?: string[];
};

function parseSummary(raw: string | null): LastOrderSummary | null {
  if (!raw) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(raw);

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as LastOrderSummary;
  } catch {
    return null;
  }
}

export function OrderSuccessClient({ locale }: { locale: Locale }) {
  const [summary, setSummary] = useState<LastOrderSummary | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSummary(parseSummary(window.sessionStorage.getItem("vkr-last-order-summary")));
      window.localStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!summary) {
    return null;
  }

  return (
    <section className="mt-8 border border-line bg-white p-5 text-left">
      <h2 className="text-xl font-semibold">
        {locale === "en" ? "Request summary" : "Кратко по заявке"}
      </h2>
      <dl className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-muted">{locale === "en" ? "Service" : "Услуга"}</dt>
          <dd>{summary.serviceTitle || (locale === "en" ? "To be confirmed" : "Уточняется")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">{locale === "en" ? "Package" : "Пакет"}</dt>
          <dd>{summary.packageTitle || (locale === "en" ? "To be confirmed" : "Уточняется")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">{locale === "en" ? "Price" : "Стоимость"}</dt>
          <dd>{summary.price || (locale === "en" ? "To be confirmed" : "Уточняется")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">{locale === "en" ? "Timing" : "Срок"}</dt>
          <dd>{summary.duration || (locale === "en" ? "To be confirmed" : "Уточняется")}</dd>
        </div>
      </dl>
      {summary.files?.length ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          {locale === "en" ? "Attached files" : "Материалы приложены"}: {summary.files.join(", ")}.
        </p>
      ) : null}
    </section>
  );
}
