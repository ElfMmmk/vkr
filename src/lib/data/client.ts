import {
  createTranslationLookup,
  localizeOrderRequestContent,
  type TranslationLookup
} from "@/lib/content-localization";
import { mapRequest, type RequestRow } from "@/lib/data/mappers";
import type { TranslationEntityType } from "@/lib/entity-translations";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import type { OrderRequest } from "@/lib/types";

type TranslationRow = {
  entity_type: TranslationEntityType;
  entity_id: string;
  fields: Record<string, unknown> | null;
};

function requestContentIds(requests: OrderRequest[]): string[] {
  return Array.from(
    new Set(
      requests.flatMap((request) => [
        ...(request.serviceId ? [request.serviceId] : []),
        ...(request.packageId ? [request.packageId] : []),
        ...(request.referenceProjectId ? [request.referenceProjectId] : []),
        ...request.selectedAddons.map((addon) => addon.id)
      ])
    )
  );
}

async function loadRequestTranslations(
  client: NonNullable<ReturnType<typeof getOptionalSupabaseAdmin>>,
  requests: OrderRequest[],
  locale: Locale
): Promise<TranslationLookup> {
  const ids = requestContentIds(requests);

  if (locale === defaultLocale || ids.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("entity_translations")
    .select("entity_type, entity_id, fields")
    .eq("locale", locale)
    .eq("is_public", true)
    .in("entity_id", ids);

  if (error) {
    return new Map();
  }

  return createTranslationLookup(
    ((data as TranslationRow[] | null) ?? []).map((row) => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      fields: row.fields ?? {}
    }))
  );
}

export async function listClientRequests(
  clientUserId: string,
  locale: Locale = defaultLocale
): Promise<OrderRequest[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("requests")
    .select("*, order_contracts(*, order_contract_feedback(*)), order_attachments(*)")
    .eq("client_user_id", clientUserId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  const requests = ((data as RequestRow[] | null) ?? []).map(mapRequest);
  const translations = await loadRequestTranslations(client, requests, locale);

  return requests.map((request) =>
    localizeOrderRequestContent(request, translations, locale)
  );
}

export async function getClientRequestById(
  clientUserId: string,
  requestId: string,
  locale: Locale = defaultLocale
): Promise<OrderRequest | null> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("requests")
    .select("*, order_contracts(*, order_contract_feedback(*)), order_attachments(*), request_status_history(*)")
    .eq("id", requestId)
    .eq("client_user_id", clientUserId)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  const request = mapRequest(data as RequestRow);
  const translations = await loadRequestTranslations(client, [request], locale);

  return localizeOrderRequestContent(request, translations, locale);
}
