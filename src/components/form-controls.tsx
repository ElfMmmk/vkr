type FieldProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
};

export function Field({ label, children, hint, required = false }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-accent"> *</span>
            <span className="sr-only">, обязательное поле</span>
          </>
        ) : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "focus-ring w-full min-w-0 border border-line bg-white px-4 py-3 text-sm text-ink shadow-none outline-none transition placeholder:text-muted/70 hover:border-muted focus-visible:border-cobalt disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted";

export const textareaClass = `${inputClass} min-h-32 resize-y`;

export const selectClass = inputClass;
