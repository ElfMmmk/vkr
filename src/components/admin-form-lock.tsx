type AdminFormFieldsetProps = {
  canWrite: boolean;
  children: React.ReactNode;
  className?: string;
};

export const adminPrimaryButtonClass =
  "focus-ring inline-flex min-h-11 items-center justify-center border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted disabled:hover:bg-line disabled:active:translate-y-0";

export const adminSmallPrimaryButtonClass =
  "focus-ring inline-flex min-h-10 items-center justify-center border border-ink bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px active:border-ink active:bg-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted disabled:hover:bg-line disabled:active:translate-y-0";

export const adminDangerButtonClass =
  "focus-ring inline-flex min-h-10 items-center justify-center border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white active:translate-y-px active:bg-white active:text-accent disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-white disabled:active:translate-y-0";

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
