"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useState } from "react";

import { FormSubmitButton } from "@/components/form-submit-button";
import {
  reorderServiceAddonsAction,
  reorderServicePackagesAction
} from "@/lib/actions/admin";

type OrderItem = {
  id: string;
  title: string;
};

export function AdminServiceItemOrderForm({
  canWrite,
  items,
  kind,
  serviceId
}: {
  canWrite: boolean;
  items: OrderItem[];
  kind: "package" | "addon";
  serviceId: string;
}) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const action = kind === "package" ? reorderServicePackagesAction : reorderServiceAddonsAction;
  const noun = kind === "package" ? "пакетов" : "дополнительных услуг";

  function moveTo(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      return;
    }

    setOrderedItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === draggedId);
      const toIndex = current.findIndex((item) => item.id === targetId);

      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const next = current.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function moveByIndex(index: number, direction: -1 | 1) {
    setOrderedItems((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = current.slice();
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }

  if (items.length < 2) {
    return null;
  }

  return (
    <form action={action} className="mt-4 grid gap-3">
      <input name="serviceId" type="hidden" value={serviceId} />
      <fieldset className="grid gap-2" disabled={!canWrite}>
        {orderedItems.map((item, index) => (
          <div
            className="flex items-center gap-2 border border-line bg-white p-3"
            draggable={canWrite}
            key={item.id}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => {
              event.preventDefault();
              moveTo(item.id);
            }}
            onDragStart={() => setDraggedId(item.id)}
          >
            <input name="itemIds" type="hidden" value={item.id} />
            <span className="text-xs font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span>
            <GripVertical aria-hidden="true" className="shrink-0 text-muted" size={17} />
            <span className="min-w-0 flex-1 break-words text-sm font-semibold">{item.title}</span>
            <button
              aria-label={`Поднять ${item.title}`}
              className="focus-ring inline-grid h-8 w-8 place-items-center border border-line bg-white text-muted disabled:opacity-40"
              disabled={index === 0}
              onClick={() => moveByIndex(index, -1)}
              type="button"
            >
              <ArrowUp aria-hidden="true" size={14} />
            </button>
            <button
              aria-label={`Опустить ${item.title}`}
              className="focus-ring inline-grid h-8 w-8 place-items-center border border-line bg-white text-muted disabled:opacity-40"
              disabled={index === orderedItems.length - 1}
              onClick={() => moveByIndex(index, 1)}
              type="button"
            >
              <ArrowDown aria-hidden="true" size={14} />
            </button>
          </div>
        ))}
      </fieldset>
      <FormSubmitButton
        className="focus-ring inline-flex min-h-10 items-center justify-center border border-ink bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        disabled={!canWrite}
        idleLabel={`Сохранить порядок ${noun}`}
        pendingLabel="Сохранение..."
      />
    </form>
  );
}
