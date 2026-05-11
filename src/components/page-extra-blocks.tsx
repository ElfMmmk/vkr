type PageExtraBlocksProps = {
  blocks: Record<string, string>;
  exclude?: string[];
};

function humanizeBlockTitle(key: string) {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function PageExtraBlocks({ blocks, exclude = [] }: PageExtraBlocksProps) {
  const excluded = new Set(exclude);
  const entries = Object.entries(blocks).filter(
    ([key, value]) => !excluded.has(key) && key.trim() && value.trim()
  );

  if (!entries.length) {
    return null;
  }

  return (
    <section className="border-t border-line bg-white py-12 md:py-16">
      <div className="container-shell grid gap-4 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <article className="border border-line bg-paper p-6" key={key}>
            <h2 className="text-2xl font-semibold">{humanizeBlockTitle(key)}</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
