"use client";

import { useRouter } from "next/navigation";

import { selectClass } from "@/components/form-controls";
import type { Locale } from "@/lib/i18n";

type PortfolioSortSelectProps = {
  currentSort: "default" | "newest" | "oldest";
  locale: Locale;
  selectedServices: string[];
  selectedTags: string[];
};

function hrefForSort({
  selectedServices,
  selectedTags,
  sort
}: {
  selectedServices: string[];
  selectedTags: string[];
  sort: "default" | "newest" | "oldest";
}) {
  const search = new URLSearchParams();

  for (const service of selectedServices) {
    search.append("service", service);
  }

  for (const tag of selectedTags) {
    search.append("tag", tag);
  }

  if (sort !== "default") {
    search.set("sort", sort);
  }

  const query = search.toString();

  return query ? `/portfolio?${query}` : "/portfolio";
}

export function PortfolioSortSelect({
  currentSort,
  locale,
  selectedServices,
  selectedTags
}: PortfolioSortSelectProps) {
  const router = useRouter();

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {locale === "en" ? "Sort" : "Сортировка"}
      </span>
      <select
        className={`${selectClass} max-w-xs`}
        name="sort"
        onChange={(event) =>
          router.push(
            hrefForSort({
              selectedServices,
              selectedTags,
              sort: event.target.value as "default" | "newest" | "oldest"
            })
          )
        }
        value={currentSort}
      >
        <option value="default">{locale === "en" ? "Featured first" : "Сначала закреплённые"}</option>
        <option value="newest">{locale === "en" ? "Newest first" : "Сначала новые"}</option>
        <option value="oldest">{locale === "en" ? "Oldest first" : "Сначала старые"}</option>
      </select>
    </label>
  );
}
