"use client";

import { ArrowDown, ArrowUp, Eye, GripVertical, Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { savePageStateAction, type AdminFormState } from "@/lib/actions/admin";
import type { PageContent } from "@/lib/types";
import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import {
  AdminLocaleTabs,
  type AdminEditingLocale
} from "@/components/admin-translated-fields";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { CharacterCount, LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import { ToastMessage } from "@/components/route-flash-toast";
import { fieldLimits } from "@/lib/field-limits";
import {
  createPageBlockRow,
  movePageBlockRow,
  movePageBlockRowByIndex,
  pageBlocksToRows,
  rowsToPageBlocks,
  serializePageBlockRows,
  type PageBlockRow
} from "@/lib/page-blocks";

const initialState: AdminFormState = {
  ok: false,
  message: ""
};

function humanizeBlockTitle(key: string) {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getUniqueBlockKey(blocks: PageBlockRow[], baseKey: string): string {
  const usedKeys = new Set(blocks.map((block) => block.key.trim()).filter(Boolean));

  if (!usedKeys.has(baseKey)) {
    return baseKey;
  }

  let index = 2;
  let candidate = `${baseKey}-${index}`;

  while (usedKeys.has(candidate)) {
    index += 1;
    candidate = `${baseKey}-${index}`;
  }

  return candidate;
}

export function AdminPageForm({
  page,
  canWrite
}: {
  page: PageContent;
  canWrite: boolean;
}) {
  const [state, formAction] = useActionState(savePageStateAction, initialState);
  const initialBlocks = pageBlocksToRows(page.blocks, page.id);
  const initialEnglishBlocks =
    page.englishTranslation?.blocks &&
    typeof page.englishTranslation.blocks === "object" &&
    !Array.isArray(page.englishTranslation.blocks)
      ? (page.englishTranslation.blocks as Record<string, unknown>)
      : {};
  const [locale, setLocale] = useState<AdminEditingLocale>("ru");
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [englishTitle, setEnglishTitle] = useState(
    typeof page.englishTranslation?.title === "string" ? page.englishTranslation.title : ""
  );
  const [englishBody, setEnglishBody] = useState(
    typeof page.englishTranslation?.body === "string" ? page.englishTranslation.body : ""
  );
  const [blocks, setBlocks] = useState<PageBlockRow[]>(initialBlocks);
  const [englishBlockValues, setEnglishBlockValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialBlocks.map((block) => [
        block.id,
        typeof initialEnglishBlocks[block.key] === "string"
          ? (initialEnglishBlocks[block.key] as string)
          : ""
      ])
    )
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const blocksJson = useMemo(() => {
    return serializePageBlockRows(blocks);
  }, [blocks]);
  const previewBlocks = useMemo(() => rowsToPageBlocks(blocks), [blocks]);
  const englishBlocks = useMemo(
    () =>
      Object.fromEntries(
        blocks
          .filter((block) => block.key.trim())
          .map((block) => [block.key.trim(), englishBlockValues[block.id]?.trim() ?? ""])
      ),
    [blocks, englishBlockValues]
  );
  const englishTranslation = useMemo(
    () =>
      JSON.stringify({
        title: englishTitle,
        body: englishBody,
        blocks: englishBlocks
      }),
    [englishBlocks, englishBody, englishTitle]
  );
  const activePreviewBlocks = locale === "ru" ? previewBlocks : englishBlocks;
  const previewEntries = Object.entries(activePreviewBlocks).filter(
    ([key, value]) => key.trim() && value.trim()
  );
  const isBlocksTooLong =
    blocksJson.length > fieldLimits.page.blocks.max ||
    englishTranslation.length > fieldLimits.page.blocks.max;
  const updateBlock = (id: string, values: Partial<Pick<PageBlockRow, "key" | "value">>) => {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...values } : block))
    );
  };
  const addBlock = () => {
    setBlocks((current) => {
      const block = createPageBlockRow(
        getUniqueBlockKey(current, "section"),
        "Новый текстовый раздел"
      );

      setEnglishBlockValues((values) => ({ ...values, [block.id]: "" }));

      return [...current, block];
    });
  };
  const activeTitle = locale === "ru" ? title : englishTitle;
  const activeBody = locale === "ru" ? body : englishBody;

  return (
    <form
      action={formAction}
      className="grid gap-4"
      onSubmit={(event) => {
        if (isBlocksTooLong) {
          event.preventDefault();
        }
      }}
    >
      <AdminFormFieldset canWrite={canWrite}>
        <input name="pageKey" type="hidden" value={page.pageKey} />
        <input name="blocks" type="hidden" value={blocksJson} />
        <input name="title" type="hidden" value={title} />
        <input name="body" type="hidden" value={body} />
        <input name="englishTranslation" type="hidden" value={englishTranslation} />
        <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Текст страницы</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Структура блоков общая, значения редактируются отдельно.
            </p>
          </div>
          <AdminLocaleTabs locale={locale} onChange={setLocale} />
        </div>
        <Field label="Заголовок" required>
          <LimitedInput
            className={inputClass}
            maxLength={fieldLimits.page.title.max}
            minLength={locale === "ru" ? fieldLimits.page.title.min : undefined}
            onChange={(event) =>
              locale === "ru"
                ? setTitle(event.target.value)
                : setEnglishTitle(event.target.value)
            }
            required={locale === "ru"}
            value={activeTitle}
          />
        </Field>
        <Field label="Основной текст" required>
          <LimitedTextarea
            className={textareaClass}
            maxLength={fieldLimits.page.body.max}
            minLength={locale === "ru" ? fieldLimits.page.body.min : undefined}
            onChange={(event) =>
              locale === "ru"
                ? setBody(event.target.value)
                : setEnglishBody(event.target.value)
            }
            required={locale === "ru"}
            value={activeBody}
          />
        </Field>
        <div className="grid gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Дополнительные разделы</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Добавляйте небольшие текстовые блоки для конкретной страницы. Название блока нужно для связи с местом вывода на сайте
            </p>
          </div>
          <button
            className="focus-ring inline-flex min-h-10 w-fit items-center justify-center gap-2 border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
            onClick={addBlock}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Добавить текстовый раздел
          </button>
          {blocks.map((block, index) => (
            <div
              className="grid gap-3 border border-line bg-paper p-3 transition hover:border-ink md:grid-cols-[auto_220px_minmax(0,1fr)_auto]"
              draggable={canWrite}
              key={block.id}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => {
                event.preventDefault();
                setBlocks((current) => movePageBlockRow(current, draggedId, block.id));
              }}
              onDragStart={() => setDraggedId(block.id)}
            >
              <div className="flex items-start gap-2">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-white text-sm font-semibold text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <GripVertical aria-hidden="true" className="mt-2 shrink-0 text-muted" size={18} />
              </div>
              <div>
                <LimitedInput
                  className={inputClass}
                  maxLength={fieldLimits.pageBlock.key.max}
                  onChange={(event) => updateBlock(block.id, { key: event.target.value })}
                  placeholder="Название блока"
                  value={block.key}
                />
              </div>
              <div>
                <LimitedTextarea
                  className={`${textareaClass} min-h-24`}
                  maxLength={fieldLimits.pageBlock.value.max}
                  onChange={(event) => {
                    if (locale === "ru") {
                      updateBlock(block.id, { value: event.target.value });
                    } else {
                      setEnglishBlockValues((current) => ({
                        ...current,
                        [block.id]: event.target.value
                      }));
                    }
                  }}
                  placeholder="Текст блока"
                  value={
                    locale === "ru"
                      ? block.value
                      : englishBlockValues[block.id] ?? ""
                  }
                />
              </div>
              <div className="flex gap-2 md:grid md:grid-cols-2">
                <button
                  aria-label={`Поднять раздел ${block.key || index + 1}`}
                  className="focus-ring inline-grid h-10 w-10 place-items-center border border-line bg-white text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === 0}
                  onClick={() => setBlocks((current) => movePageBlockRowByIndex(current, index, -1))}
                  type="button"
                >
                  <ArrowUp aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label={`Опустить раздел ${block.key || index + 1}`}
                  className="focus-ring inline-grid h-10 w-10 place-items-center border border-line bg-white text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === blocks.length - 1}
                  onClick={() => setBlocks((current) => movePageBlockRowByIndex(current, index, 1))}
                  type="button"
                >
                  <ArrowDown aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label="Удалить раздел"
                  className="focus-ring inline-grid h-10 w-10 place-items-center border border-line bg-white text-ink transition hover:border-accent hover:text-accent active:translate-y-px md:col-span-2"
                  onClick={() => {
                    setBlocks((current) => current.filter((item) => item.id !== block.id));
                    setEnglishBlockValues((current) => {
                      const next = { ...current };
                      delete next[block.id];

                      return next;
                    });
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={17} />
                </button>
              </div>
            </div>
          ))}
          <CharacterCount
            className={isBlocksTooLong ? "font-semibold" : undefined}
            max={fieldLimits.page.blocks.max}
            value={blocksJson}
          />
          {isBlocksTooLong ? (
            <p className="text-sm text-accent">
              Дополнительные разделы слишком длинные. Сократите текст перед сохранением.
            </p>
          ) : null}
        </div>
        <details className="border border-line bg-white">
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 p-4 [&::-webkit-details-marker]:hidden">
            <Eye aria-hidden="true" className="text-muted" size={18} />
            <h3 className="text-sm font-semibold text-ink">Предпросмотр страницы</h3>
          </summary>
          <div className="grid gap-5 border-t border-line p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Основной экран</p>
              <h2 className="mt-2 text-3xl font-semibold">{activeTitle || "Без заголовка"}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                {activeBody || "Основной текст пока не заполнен"}
              </p>
            </div>
            {previewEntries.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {previewEntries.map(([key, value]) => (
                  <article className="border border-line bg-paper p-4" key={key}>
                    <h4 className="text-lg font-semibold">{humanizeBlockTitle(key)}</h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{value}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="border border-dashed border-line bg-paper p-4 text-sm text-muted">
                Дополнительные разделы появятся здесь после добавления.
              </p>
            )}
          </div>
        </details>
        {state.message ? (
          <ToastMessage
            key={`${state.ok}-${state.message}`}
            message={state.message}
            tone={state.ok ? "success" : "error"}
          />
        ) : null}
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          disabled={isBlocksTooLong}
          idleLabel="Сохранить страницу"
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
    </form>
  );
}
