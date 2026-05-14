"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-route]", error.message, error.digest);
  }, [error]);

  return (
    <section className="space-y-5 border border-line bg-white p-6 shadow-soft">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Административная панель
        </p>
        <h1 className="text-2xl font-semibold text-ink">Не удалось выполнить действие</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Данные не были изменены. Попробуйте повторить действие или вернитесь к обзору панели.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="focus-ring inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent"
          onClick={reset}
          type="button"
        >
          Повторить
        </button>
        <Link
          className="focus-ring inline-flex min-h-11 items-center border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
          href="/admin"
        >
          К обзору
        </Link>
      </div>
    </section>
  );
}
