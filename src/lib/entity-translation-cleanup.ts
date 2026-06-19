import type { SupabaseClient } from "@supabase/supabase-js";

import type { TranslationEntityType } from "@/lib/entity-translations";
import type { Database } from "@/lib/supabase/database.types";

type AppClient = SupabaseClient<Database>;

export type EntityTranslationReference = {
  entityType: TranslationEntityType;
  entityId: string;
};

export async function deleteEntityTranslations(
  client: AppClient,
  references: EntityTranslationReference[]
): Promise<void> {
  const idsByType = new Map<TranslationEntityType, Set<string>>();

  for (const reference of references) {
    if (!reference.entityId) {
      continue;
    }

    const ids = idsByType.get(reference.entityType) ?? new Set<string>();
    ids.add(reference.entityId);
    idsByType.set(reference.entityType, ids);
  }

  for (const [entityType, idSet] of idsByType) {
    const ids = Array.from(idSet);

    if (ids.length === 0) {
      continue;
    }

    const { error } = await client
      .from("entity_translations")
      .delete()
      .eq("entity_type", entityType)
      .in("entity_id", ids);

    if (error) {
      throw error;
    }
  }
}
