import type { ReactNode } from "react";

import type { OrderStepId } from "@/lib/order-draft";

export function invalidClass(hasError: boolean) {
  return hasError ? " border-accent bg-accent/5 focus-visible:border-accent" : "";
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-2 text-sm text-accent">{errors[0]}</p>;
}

export function StepPanel({
  active,
  children,
  id
}: {
  active: boolean;
  children: ReactNode;
  id: OrderStepId;
}) {
  return (
    <section aria-labelledby={`order-step-${id}`} hidden={!active}>
      {children}
    </section>
  );
}
