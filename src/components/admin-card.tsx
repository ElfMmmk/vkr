type AdminCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function AdminCard({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = false
}: AdminCardProps) {
  if (collapsible) {
    return (
      <details className="border border-line bg-white shadow-sm" open={defaultOpen}>
        <summary className="focus-ring cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Открыть редактор
          </p>
        </summary>
        <div className="border-t border-line p-5">{children}</div>
      </details>
    );
  }

  return (
    <section className="border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-line pb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
