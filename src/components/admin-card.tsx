import { ChevronDown } from "lucide-react";

type AdminCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  variant?: "default" | "highlight";
};

export function AdminCard({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = false,
  variant = "default"
}: AdminCardProps) {
  const sectionClass =
    variant === "highlight"
      ? "border border-cobalt/25 bg-cobalt/10 p-5 shadow-sm"
      : "border border-line bg-white p-5 shadow-sm";

  if (collapsible) {
    return (
      <details className="border border-line bg-white shadow-sm" open={defaultOpen}>
        <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <h2 className="text-xl font-semibold">{title}</h2>
            {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
            <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Редактировать
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="details-chevron mt-1 shrink-0 text-muted" size={20} />
        </summary>
        <div className="border-t border-line p-5">{children}</div>
      </details>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="mb-5 border-b border-line pb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
