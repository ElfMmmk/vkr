"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { savePageStateAction, type AdminFormState } from "@/lib/actions/admin";
import type { PageContent } from "@/lib/types";
import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, textareaClass } from "@/components/form-controls";

type BlockRow = {
  id: string;
  key: string;
  value: string;
};

const initialState: AdminFormState = {
  ok: false,
  message: ""
};

function createBlockRow(key = "", value = "", id = crypto.randomUUID()): BlockRow {
  return {
    id,
    key,
    value
  };
}

export function AdminPageForm({
  page,
  canWrite
}: {
  page: PageContent;
  canWrite: boolean;
}) {
  const [state, formAction] = useActionState(savePageStateAction, initialState);
  const [blocks, setBlocks] = useState<BlockRow[]>(
    Object.entries(page.blocks).map(([key, value], index) =>
      createBlockRow(key, value, `${page.id}-${key || index}`)
    )
  );
  const blocksJson = useMemo(() => {
    const payload: Record<string, string> = {};

    for (const block of blocks) {
      const key = block.key.trim();

      if (key) {
        payload[key] = block.value;
      }
    }

    return JSON.stringify(payload);
  }, [blocks]);

  return (
    <form action={formAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="pageKey" type="hidden" value={page.pageKey} />
        <input name="blocks" type="hidden" value={blocksJson} />
        <Field label="Заголовок">
          <input className={inputClass} defaultValue={page.title} name="title" />
        </Field>
        <Field label="Основной текст">
          <textarea className={textareaClass} defaultValue={page.body} name="body" />
        </Field>
        <div className="grid gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Дополнительные разделы</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Добавляйте небольшие текстовые блоки для конкретной страницы. Название блока нужно для связи с местом вывода на сайте
            </p>
          </div>
          {blocks.map((block) => (
            <div className="grid gap-3 border border-line bg-paper p-3 md:grid-cols-[220px_minmax(0,1fr)_auto]" key={block.id}>
              <input
                className={inputClass}
                onChange={(event) => {
                  const value = event.target.value;
                  setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, key: value } : item));
                }}
                placeholder="Название блока"
                value={block.key}
              />
              <input
                className={inputClass}
                onChange={(event) => {
                  const value = event.target.value;
                  setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, value } : item));
                }}
                placeholder="Текст блока"
                value={block.value}
              />
              <button
                aria-label="Удалить раздел"
                className="focus-ring inline-grid min-h-11 place-items-center border border-line bg-white px-3 text-ink transition hover:border-accent hover:text-accent active:translate-y-px"
                onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))}
                type="button"
              >
                <Trash2 aria-hidden="true" size={17} />
              </button>
            </div>
          ))}
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
            onClick={() => setBlocks((current) => [...current, createBlockRow()])}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Добавить раздел
          </button>
        </div>
        {state.message ? (
          <div className={`border px-4 py-3 text-sm leading-6 ${state.ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-accent/30 bg-accent/10 text-accent"}`}>
            {state.message}
          </div>
        ) : null}
        <button className={adminPrimaryButtonClass}>Сохранить страницу</button>
      </AdminFormFieldset>
    </form>
  );
}
