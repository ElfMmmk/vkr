export type PageBlockRow = {
  id: string;
  key: string;
  value: string;
};

export function createPageBlockRow(key = "", value = "", id = crypto.randomUUID()): PageBlockRow {
  return {
    id,
    key,
    value
  };
}

export function pageBlocksToRows(
  blocks: Record<string, string>,
  idPrefix = "page-block"
): PageBlockRow[] {
  return Object.entries(blocks).map(([key, value], index) =>
    createPageBlockRow(key, value, `${idPrefix}-${key || index}`)
  );
}

export function rowsToPageBlocks(rows: PageBlockRow[]): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const row of rows) {
    const key = row.key.trim();

    if (key) {
      payload[key] = row.value;
    }
  }

  return payload;
}

export function serializePageBlockRows(rows: PageBlockRow[]): string {
  return JSON.stringify(rowsToPageBlocks(rows));
}

export function movePageBlockRow(
  rows: PageBlockRow[],
  draggedId: string | null,
  targetId: string
): PageBlockRow[] {
  if (!draggedId || draggedId === targetId) {
    return rows;
  }

  const fromIndex = rows.findIndex((row) => row.id === draggedId);
  const toIndex = rows.findIndex((row) => row.id === targetId);

  if (fromIndex < 0 || toIndex < 0) {
    return rows;
  }

  const next = rows.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  return next;
}

export function movePageBlockRowByIndex(
  rows: PageBlockRow[],
  index: number,
  direction: -1 | 1
): PageBlockRow[] {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= rows.length) {
    return rows;
  }

  const next = rows.slice();
  const [moved] = next.splice(index, 1);
  next.splice(nextIndex, 0, moved);

  return next;
}
