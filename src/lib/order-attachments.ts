export const ORDER_ATTACHMENTS_BUCKET = "order-attachments";
export const MAX_ORDER_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ORDER_ATTACHMENT_COUNT = 5;

const allowedAttachmentTypes = new Set([
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain"
]);

const allowedAttachmentExtensions = new Set(["doc", "docx", "jpeg", "jpg", "pdf", "png", "txt", "webp"]);

export type OrderAttachmentFileLike = {
  name: string;
  size: number;
  type: string;
};

export function getOrderAttachmentExtension(file: OrderAttachmentFileLike): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function validateOrderAttachmentFile(file: OrderAttachmentFileLike): string | null {
  const extension = getOrderAttachmentExtension(file);

  if (file.size > MAX_ORDER_ATTACHMENT_BYTES) {
    return "Файл должен быть не больше 10 МБ.";
  }

  if (!allowedAttachmentTypes.has(file.type) || !allowedAttachmentExtensions.has(extension)) {
    return "Поддерживаются только PDF, DOC, DOCX, TXT, JPEG, PNG и WebP.";
  }

  return null;
}

export function validateOrderAttachmentList(files: OrderAttachmentFileLike[]): string | null {
  if (files.length > MAX_ORDER_ATTACHMENT_COUNT) {
    return "Можно приложить не больше 5 файлов.";
  }

  for (const file of files) {
    const error = validateOrderAttachmentFile(file);

    if (error) {
      return error;
    }
  }

  return null;
}

export function sanitizeOrderAttachmentName(name: string): string {
  const cleaned = name
    .replace(/[^\p{L}\p{N}._ -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "attachment";
}
