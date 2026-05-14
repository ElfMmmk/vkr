"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useState } from "react";

import { FormSubmitButton } from "@/components/form-submit-button";
import { reorderServicesAction } from "@/lib/actions/admin";
import type { Service } from "@/lib/types";

export function AdminServiceOrderForm({
  services,
  canWrite
}: {
  services: Service[];
  canWrite: boolean;
}) {
  const [orderedServices, setOrderedServices] = useState(services);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function moveService(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      return;
    }

    setOrderedServices((current) => {
      const fromIndex = current.findIndex((service) => service.id === draggedId);
      const toIndex = current.findIndex((service) => service.id === targetId);

      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const next = current.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return next;
    });
  }

  function moveServiceByIndex(index: number, direction: -1 | 1) {
    setOrderedServices((current) => {
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

  return (
    <form action={reorderServicesAction} className="grid gap-4">
      <fieldset className="grid gap-3" disabled={!canWrite}>
        {orderedServices.map((service, index) => (
          <div
            className="flex items-start gap-3 border border-line bg-white p-4 transition hover:border-ink"
            draggable={canWrite}
            key={service.id}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => {
              event.preventDefault();
              moveService(service.id);
            }}
            onDragStart={() => setDraggedId(service.id)}
          >
            <input name="serviceIds" type="hidden" value={service.id} />
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-line text-sm font-semibold text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <GripVertical aria-hidden="true" className="mt-2 shrink-0 text-muted" size={18} />
            <div className="min-w-0">
              <p className="font-semibold text-ink">{service.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{service.description}</p>
            </div>
            <div className="ml-auto grid shrink-0 grid-cols-2 gap-2">
              <button
                aria-label={`Поднять услугу ${service.title}`}
                className="focus-ring inline-grid h-9 w-9 place-items-center border border-line bg-white text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canWrite || index === 0}
                onClick={() => moveServiceByIndex(index, -1)}
                type="button"
              >
                <ArrowUp aria-hidden="true" size={16} />
              </button>
              <button
                aria-label={`Опустить услугу ${service.title}`}
                className="focus-ring inline-grid h-9 w-9 place-items-center border border-line bg-white text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canWrite || index === orderedServices.length - 1}
                onClick={() => moveServiceByIndex(index, 1)}
                type="button"
              >
                <ArrowDown aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
        ))}
      </fieldset>
      <FormSubmitButton
        className="focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canWrite}
        idleLabel="Сохранить порядок услуг"
        pendingLabel="Сохранение..."
      />
    </form>
  );
}
