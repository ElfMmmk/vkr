"use client";

import { useRouter } from "next/navigation";

import { selectClass } from "@/components/form-controls";

type PortfolioSortSelectProps = {
  currentSort: "default" | "newest" | "oldest";
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
  selectedServices,
  selectedTags
}: PortfolioSortSelectProps) {
  const router = useRouter();

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Сортировка
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
        <option value="default">Сначала закреплённые</option>
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
      </select>
    </label>
  );
}
