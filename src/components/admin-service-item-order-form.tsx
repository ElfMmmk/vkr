"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  saveServiceAddonsOrderAction,
  saveServicePackagesOrderAction
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const dragChangedRef = useRef(false);
  const dragOrderRef = useRef<OrderItem[] | null>(null);
  const action = kind === "package" ? saveServicePackagesOrderAction : saveServiceAddonsOrderAction;

  function persistOrder(nextItems: OrderItem[]) {
    if (!canWrite) {
      return;
    }

    const formData = new FormData();
    formData.set("serviceId", serviceId);
    nextItems.forEach((item) => formData.append("itemIds", item.id));
    setSaveStatus("saving");

    startTransition(() => {
      void action(formData)
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("error"));
    });
  }

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
      dragChangedRef.current = true;
      dragOrderRef.current = next;
      return next;
    });
  }

  function moveByIndex(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= orderedItems.length) {
      return;
    }

    const next = orderedItems.slice();
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    setOrderedItems(next);
    persistOrder(next);
  }

  function handleDragEnd() {
    setDraggedId(null);

    if (dragChangedRef.current && dragOrderRef.current) {
      persistOrder(dragOrderRef.current);
    }

    dragChangedRef.current = false;
    dragOrderRef.current = null;
  }

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-3">
      <fieldset className="grid gap-2" disabled={!canWrite}>
        {orderedItems.map((item, index) => (
          <div
            className="flex items-center gap-2 border border-line bg-white p-3"
            draggable={canWrite && !isPending}
            key={item.id}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => {
              event.preventDefault();
              if (isPending) {
                return;
              }
              moveTo(item.id);
            }}
            onDragStart={() => {
              if (isPending) {
                return;
              }
              dragChangedRef.current = false;
              dragOrderRef.current = null;
              setDraggedId(item.id);
            }}
          >
            <span className="text-xs font-semibold text-muted">{String(index + 1).padStart(2, "0")}</span>
            <GripVertical aria-hidden="true" className="shrink-0 text-muted" size={17} />
            <span className="min-w-0 flex-1 break-words text-sm font-semibold">{item.title}</span>
            <button
              aria-label={`Поднять ${item.title}`}
              className="focus-ring inline-grid h-8 w-8 place-items-center border border-line bg-white text-muted disabled:opacity-40"
              disabled={!canWrite || index === 0 || isPending}
              onClick={() => moveByIndex(index, -1)}
              type="button"
            >
              <ArrowUp aria-hidden="true" size={14} />
            </button>
            <button
              aria-label={`Опустить ${item.title}`}
              className="focus-ring inline-grid h-8 w-8 place-items-center border border-line bg-white text-muted disabled:opacity-40"
              disabled={!canWrite || index === orderedItems.length - 1 || isPending}
              onClick={() => moveByIndex(index, 1)}
              type="button"
            >
              <ArrowDown aria-hidden="true" size={14} />
            </button>
          </div>
        ))}
      </fieldset>
      <p aria-live="polite" className="text-xs leading-5 text-muted">
        {saveStatus === "saving"
          ? "Порядок сохраняется..."
          : saveStatus === "saved"
            ? "Порядок сохранён автоматически."
            : saveStatus === "error"
              ? "Не удалось сохранить порядок. Измените порядок ещё раз или обновите страницу."
              : "Порядок сохраняется автоматически после изменения."}
      </p>
    </div>
  );
}
