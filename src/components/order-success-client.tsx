"use client";

import { useEffect, useState } from "react";

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

export function OrderSuccessClient() {
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
      <h2 className="text-xl font-semibold">Кратко по заявке</h2>
      <dl className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-muted">Услуга</dt>
          <dd>{summary.serviceTitle || "Уточняется"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Пакет</dt>
          <dd>{summary.packageTitle || "Уточняется"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Стоимость</dt>
          <dd>{summary.price || "Уточняется"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Срок</dt>
          <dd>{summary.duration || "Уточняется"}</dd>
        </div>
      </dl>
      {summary.files?.length ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          Материалы приложены: {summary.files.join(", ")}.
        </p>
      ) : null}
    </section>
  );
}
