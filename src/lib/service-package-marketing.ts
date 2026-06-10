export function parsePackageIncludedItems(input: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const item of input.split(/\r?\n/)) {
    const cleanItem = item.trim().replace(/\s+/g, " ");
    const key = cleanItem.toLowerCase();

    if (!cleanItem || seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(cleanItem);
  }

  return items;
}

export function formatPackageIncludedItems(items: string[]): string {
  return items.join("\n");
}
