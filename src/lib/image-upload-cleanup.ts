import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type AppClient = SupabaseClient<Database>;

export type ImageCleanupStage = "translation" | "metadata" | "storage";

export type ImageCleanupError = {
  stage: ImageCleanupStage;
  error: unknown;
};

export async function cleanupUploadedImage(
  client: AppClient,
  input: {
    imageId: string;
    storagePath: string;
  }
): Promise<ImageCleanupError[]> {
  const errors: ImageCleanupError[] = [];
  const translationCleanup = await client
    .from("entity_translations")
    .delete()
    .eq("entity_type", "image")
    .eq("entity_id", input.imageId);

  if (translationCleanup.error) {
    errors.push({ stage: "translation", error: translationCleanup.error });
  }

  const metadataCleanup = await client.from("images").delete().eq("id", input.imageId);

  if (metadataCleanup.error) {
    errors.push({ stage: "metadata", error: metadataCleanup.error });
  }

  const storageCleanup = await client.storage
    .from("portfolio-images")
    .remove([input.storagePath]);

  if (storageCleanup.error) {
    errors.push({ stage: "storage", error: storageCleanup.error });
  }

  return errors;
}
