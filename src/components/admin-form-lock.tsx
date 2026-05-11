type AdminFormFieldsetProps = {
  canWrite: boolean;
  children: React.ReactNode;
  className?: string;
};

export const adminPrimaryButtonClass =
  "focus-ring border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent active:bg-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted disabled:hover:bg-line";

export const adminSmallPrimaryButtonClass =
  "focus-ring border border-ink bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent active:bg-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted disabled:hover:bg-line";

export const adminDangerButtonClass =
  "focus-ring border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white active:bg-white active:text-accent disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-white";

export function AdminFormFieldset({
  canWrite,
  children,
  className = "grid gap-4"
}: AdminFormFieldsetProps) {
  return (
    <fieldset
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={!canWrite}
    >
      {children}
    </fieldset>
  );
}
