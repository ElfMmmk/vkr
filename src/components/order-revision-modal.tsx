"use client";

import { useId, useState } from "react";

import { requestOrderContractRevisionAction } from "@/app/account/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function OrderRevisionModal({
  contractId,
  requestId
}: {
  contractId: string;
  requestId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        className="focus-ring inline-flex min-h-11 w-full items-center justify-center border border-accent bg-white px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white active:translate-y-px"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Запросить изменения
      </button>
      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 py-8"
          role="dialog"
        >
          <div className="max-h-full w-full max-w-xl overflow-y-auto border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <h2 className="text-xl font-semibold" id={titleId}>
                  Запросить изменения
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Опишите, какие условия нужно уточнить или изменить. Сообщение появится в обсуждении заказа.
                </p>
              </div>
              <button
                className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center border border-line text-lg leading-none text-muted hover:border-ink hover:text-ink"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <span className="sr-only">Закрыть окно</span>
                ×
              </button>
            </div>
            <form action={requestOrderContractRevisionAction} className="mt-5 grid gap-3">
              <input name="requestId" type="hidden" value={requestId} />
              <input name="contractId" type="hidden" value={contractId} />
              <label className="text-sm font-semibold" htmlFor="contract-revision-feedback">
                Что нужно изменить
              </label>
              <textarea
                className="min-h-36 w-full border border-line bg-white px-3 py-2 text-sm leading-6"
                id="contract-revision-feedback"
                maxLength={1000}
                minLength={10}
                name="feedback"
                placeholder="Например: уточнить состав финальных файлов, сроки передачи или этапы работы"
                required
              />
              <p className="text-xs text-muted">От 10 до 1000 символов.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormSubmitButton
                  className="focus-ring inline-flex min-h-11 items-center justify-center border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-accent active:translate-y-px"
                  idleLabel="Отправить запрос"
                  pendingLabel="Отправка..."
                />
                <button
                  className="focus-ring inline-flex min-h-11 items-center justify-center border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
