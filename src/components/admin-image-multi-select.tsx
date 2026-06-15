"use client";

import Image from "next/image";
import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { PortfolioImage } from "@/lib/types";

function imageLabel(image: PortfolioImage): string {
  return image.title || image.caption || image.storagePath || "Без названия";
}

export function AdminImageMultiSelect({
  images,
  selectedIds: initialSelectedIds
}: {
  images: PortfolioImage[];
  selectedIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialSelectedIds));
  const selectedImages = images.filter((image) => selectedIds.has(image.id));
  const filteredImages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");

    if (!normalizedQuery) {
      return images;
    }

    return images.filter((image) =>
      `${imageLabel(image)} ${image.storagePath}`
        .toLocaleLowerCase("ru")
        .includes(normalizedQuery)
    );
  }, [images, query]);

  function toggleImage(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <div className="relative">
      {Array.from(selectedIds).map((id) => (
        <input key={id} name="galleryImageIds" type="hidden" value={id} />
      ))}

      <button
        aria-expanded={isOpen}
        className="focus-ring flex min-h-12 w-full items-center justify-between border border-line bg-white px-4 py-3 text-left text-sm font-semibold"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>
          {selectedIds.size
            ? `Выбрано изображений: ${selectedIds.size}`
            : "Выберите изображения"}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="absolute z-30 mt-2 w-full border border-line bg-white p-3 shadow-soft">
          <label className="flex items-center gap-2 border border-line bg-paper px-3">
            <Search aria-hidden="true" className="h-4 w-4 text-muted" />
            <span className="sr-only">Поиск изображений</span>
            <input
              className="min-h-11 w-full bg-transparent text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию или имени файла"
              type="search"
              value={query}
            />
          </label>
          <div className="mt-3 max-h-80 overflow-y-auto">
            {filteredImages.map((image) => (
              <label
                className="flex cursor-pointer items-center gap-3 border-b border-line p-2 text-sm last:border-b-0 hover:bg-paper"
                key={image.id}
              >
                <input
                  checked={selectedIds.has(image.id)}
                  onChange={() => toggleImage(image.id)}
                  type="checkbox"
                />
                <span className="relative h-12 w-16 shrink-0 overflow-hidden bg-line">
                  {image.publicUrl ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="64px"
                      src={image.publicUrl}
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{imageLabel(image)}</span>
                  <span className="block truncate text-xs text-muted">{image.storagePath}</span>
                </span>
              </label>
            ))}
            {!filteredImages.length ? (
              <p className="p-4 text-center text-sm text-muted">Ничего не найдено</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedImages.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {selectedImages.map((image) => (
            <div
              className="flex items-center gap-3 border border-line bg-paper p-2 text-sm"
              key={image.id}
            >
              <span className="relative h-12 w-16 shrink-0 overflow-hidden bg-line">
                {image.publicUrl ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="64px"
                    src={image.publicUrl}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">{imageLabel(image)}</span>
              <button
                aria-label={`Убрать ${imageLabel(image)}`}
                className="focus-ring p-2 text-muted hover:text-accent"
                onClick={() => toggleImage(image.id)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
