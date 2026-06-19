import type { ReactNode } from "react";

import type { OrderStepId } from "@/lib/order-draft";
import type { OrderAttachmentFileLike } from "@/lib/order-attachments";
import type { Locale } from "@/lib/i18n";

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

export function formatBytes(size: number, locale: Locale = "ru"): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} ${locale === "en" ? "KB" : "КБ"}`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} ${locale === "en" ? "MB" : "МБ"}`;
}

export function fileListToMetadata(fileList: FileList | null): OrderAttachmentFileLike[] {
  return Array.from(fileList ?? []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type
  }));
}
