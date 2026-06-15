"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className: string;
  describedBy?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  describedBy,
  disabled = false,
  name,
  value
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      aria-describedby={describedBy}
      className={className}
      disabled={disabled || pending}
      name={name}
      type="submit"
      value={value}
    >
      {pending ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
