import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ORDER_ATTACHMENTS_BUCKET,
  sanitizeOrderAttachmentName,
  validateOrderAttachmentList
} from "@/lib/order-attachments";
import type { Database, TablesInsert } from "@/lib/supabase/database.types";
import type { OrderAttachment } from "@/lib/types";

type AppClient = SupabaseClient<Database>;

export type UploadOrderAttachmentsResult =
  | {
      ok: true;
      attachments: OrderAttachment[];
    }
  | {
      ok: false;
      message: string;
    };

export type DeleteOrderAttachmentResult =
  | {
      ok: true;
      requestId: string;
    }
  | {
      ok: false;
      message: string;
    };

export function getOrderAttachmentFiles(
  formData: FormData,
  fieldName = "attachments"
): File[] {
  return formData
    .getAll(fieldName)
    .filter((item): item is File => item instanceof File && item.size > 0);
}

function getSafeStorageExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

async function removeStoragePaths(client: AppClient, storagePaths: string[]): Promise<void> {
  if (storagePaths.length > 0) {
    await client.storage.from(ORDER_ATTACHMENTS_BUCKET).remove(storagePaths);
  }
}

async function removeAttachmentRows(client: AppClient, attachmentIds: string[]): Promise<void> {
  if (attachmentIds.length > 0) {
    await client.from("order_attachments").delete().in("id", attachmentIds);
  }
}

export async function cleanupOrderAttachmentStorage(
  client: AppClient,
  attachments: Pick<OrderAttachment, "storagePath">[]
): Promise<void> {
  await removeStoragePaths(
    client,
    attachments.map((attachment) => attachment.storagePath)
  );
}

export async function uploadOrderAttachmentFiles(
  client: AppClient,
  input: {
    requestId: string;
    clientUserId: string | null;
    files: File[];
  }
): Promise<UploadOrderAttachmentsResult> {
  const validationError = validateOrderAttachmentList(input.files);

  if (validationError) {
    return {
      ok: false,
      message: validationError
    };
  }

  const uploadedPaths: string[] = [];
  const insertedAttachmentIds: string[] = [];
  const attachments: OrderAttachment[] = [];

  for (const file of input.files) {
    const fileName = sanitizeOrderAttachmentName(file.name);
    const extension = getSafeStorageExtension(file);
    const storagePath = `${input.requestId}/${randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();
    const upload = await client.storage.from(ORDER_ATTACHMENTS_BUCKET).upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (upload.error) {
      await removeStoragePaths(client, uploadedPaths);
      await removeAttachmentRows(client, insertedAttachmentIds);

      return {
        ok: false,
        message: "Не удалось загрузить материалы. Проверьте файлы и попробуйте ещё раз."
      };
    }

    uploadedPaths.push(storagePath);

    const payload: TablesInsert<"order_attachments"> = {
      client_user_id: input.clientUserId,
      content_type: file.type || "application/octet-stream",
      file_name: fileName,
      request_id: input.requestId,
      size: file.size,
      storage_path: storagePath
    };
    const metadata = await client.from("order_attachments").insert(payload).select("*").single();

    if (metadata.error || !metadata.data) {
      await removeStoragePaths(client, uploadedPaths);
      await removeAttachmentRows(client, insertedAttachmentIds);

      return {
        ok: false,
        message: "Не удалось сохранить материалы заказа. Попробуйте ещё раз."
      };
    }

    insertedAttachmentIds.push(metadata.data.id);

    attachments.push({
      clientUserId: metadata.data.client_user_id,
      contentType: metadata.data.content_type,
      createdAt: metadata.data.created_at,
      fileName: metadata.data.file_name,
      id: metadata.data.id,
      requestId: metadata.data.request_id,
      size: metadata.data.size,
      storagePath: metadata.data.storage_path
    });
  }

  return {
    ok: true,
    attachments
  };
}

export async function createOrderAttachmentSignedUrls(
  client: AppClient,
  attachments: OrderAttachment[]
): Promise<OrderAttachment[]> {
  return Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await client.storage
        .from(ORDER_ATTACHMENTS_BUCKET)
        .createSignedUrl(attachment.storagePath, 60 * 10);

      return {
        ...attachment,
        signedUrl: data?.signedUrl
      };
    })
  );
}

export async function deleteOrderAttachmentFile(
  client: AppClient,
  input: {
    attachmentId: string;
    actorUserId: string;
    canDeleteAny: boolean;
    requestId?: string;
  }
): Promise<DeleteOrderAttachmentResult> {
  const { data: attachment, error: attachmentError } = await client
    .from("order_attachments")
    .select("id, request_id, client_user_id, storage_path")
    .eq("id", input.attachmentId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return {
      ok: false,
      message: "Файл не найден."
    };
  }

  if (!input.canDeleteAny && attachment.client_user_id !== input.actorUserId) {
    return {
      ok: false,
      message: "Недостаточно прав для удаления файла."
    };
  }

  if (input.requestId && attachment.request_id !== input.requestId) {
    return {
      ok: false,
      message: "Файл не относится к указанной заявке."
    };
  }

  const storageResult = await client.storage
    .from(ORDER_ATTACHMENTS_BUCKET)
    .remove([attachment.storage_path]);

  if (storageResult.error) {
    return {
      ok: false,
      message: "Не удалось удалить файл из хранилища."
    };
  }

  const { error: deleteError } = await client
    .from("order_attachments")
    .delete()
    .eq("id", attachment.id);

  if (deleteError) {
    return {
      ok: false,
      message: "Файл удалён из хранилища, но метаданные удалить не удалось."
    };
  }

  return {
    ok: true,
    requestId: attachment.request_id
  };
}
