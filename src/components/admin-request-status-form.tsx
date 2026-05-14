"use client";

import { useRef, useTransition } from "react";

import { AdminFormFieldset } from "@/components/admin-form-lock";
import { selectClass } from "@/components/form-controls";
import { updateRequestStatusAction } from "@/lib/actions/admin";
import { requestStatusLabels, requestStatuses } from "@/lib/request-status";
import type { RequestStatus } from "@/lib/types";

export function AdminRequestStatusForm({
  id,
  status,
  canWrite,
  redirectTo
}: {
  id: string;
  status: RequestStatus;
  canWrite: boolean;
  redirectTo?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form action={updateRequestStatusAction} className="grid gap-3" key={`${id}-${status}`} ref={formRef}>
      <AdminFormFieldset canWrite={canWrite} className="grid gap-3">
        <input name="id" type="hidden" value={id} />
        {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Текущий статус: {requestStatusLabels[status]}
        </p>
        <select
          className={selectClass}
          defaultValue={status}
          disabled={!canWrite || isPending}
          name="status"
          onChange={() => {
            startTransition(() => {
              formRef.current?.requestSubmit();
            });
          }}
          required
        >
          {requestStatuses.map((requestStatus) => (
            <option key={requestStatus} value={requestStatus}>
              {requestStatusLabels[requestStatus]}
            </option>
          ))}
        </select>
        <p className="text-xs leading-5 text-muted">
          {isPending ? "Сохранение статуса..." : "Выбор сразу сохраняет новый статус"}
        </p>
      </AdminFormFieldset>
    </form>
  );
}
