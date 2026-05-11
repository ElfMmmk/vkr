type FieldProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "focus-ring w-full border border-line bg-white px-4 py-3 text-sm text-ink shadow-none outline-none transition placeholder:text-muted/70 focus-visible:border-cobalt";

export const textareaClass = `${inputClass} min-h-32 resize-y`;

export const selectClass = inputClass;
