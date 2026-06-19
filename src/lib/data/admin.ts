import { demoPages, demoProjects, demoRequests, demoServices, demoTags } from "@/lib/demo-data";
import type { AdminUserListOptions } from "@/lib/admin-user-query";
import {
  attachLegacyProjectImages,
  attachProjectMedia,
  mapImage,
  mapAnalyticsEvent,
  mapPage,
  mapProject,
  mapRequest,
  mapService,
  mapTag,
  type ImageRow,
  type AnalyticsEventRow,
  type PageRow,
  type ProjectRow,
  type RequestRow,
  type ServiceRow,
  type TagRow
} from "@/lib/data/mappers";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import type {
  RequestStatus,
  TranslationEntityType
} from "@/lib/supabase/database.types";
import type {
  AdminUserListResult,
  AnalyticsEvent,
  OrderRequest,
  PageContent,
  PortfolioImage,
  Project,
  Service,
  Tag,
  UserProfile,
  UserRole
} from "@/lib/types";

function requireAdminData<T>(data: T | null, error: { message: string } | null, label: string): T {
  if (error || !data) {
    throw new Error(`Failed to load ${label}: ${error?.message ?? "empty response"}`);
  }

  return data;
}

function normalizeRequestSearch(query: string | undefined): string {
  return query?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function isMissingProjectImagesRelation(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("project_images"));
}

function isMissingFeaturedColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("is_featured"));
}

function isMissingDisplayOrderColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("display_order"));
}

function isMissingAnalyticsEventsTable(error: { message?: string } | null): boolean {
  const message = error?.message ?? "";

  return message.includes("analytics_events") || message.includes("schema cache");
}

function isRequestStatus(value: string): value is RequestStatus {
  return (
    value === "new" ||
    value === "in_progress" ||
    value === "approved" ||
    value === "completed" ||
    value === "rejected"
  );
}

type AdminTranslationRow = {
  entity_type: TranslationEntityType;
  entity_id: string;
  fields: Record<string, unknown> | null;
};

async function loadAdminTranslations(
  client: NonNullable<ReturnType<typeof getOptionalSupabaseAdmin>>,
  ids: string[]
): Promise<Map<string, Record<string, unknown>>> {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await client
    .from("entity_translations")
    .select("entity_type, entity_id, fields")
    .eq("locale", "en")
    .in("entity_id", ids);

  if (error) {
    return new Map();
  }

  return new Map(
    ((data as AdminTranslationRow[] | null) ?? []).map((row) => [
      `${row.entity_type}:${row.entity_id}`,
      row.fields ?? {}
    ])
  );
}

function translationFor(
  translations: Map<string, Record<string, unknown>>,
  entityType: TranslationEntityType,
  entityId: string
): Record<string, unknown> | undefined {
  return translations.get(`${entityType}:${entityId}`);
}

async function attachAdminProjectTranslations(
  client: NonNullable<ReturnType<typeof getOptionalSupabaseAdmin>>,
  projects: Project[]
): Promise<Project[]> {
  const translations = await loadAdminTranslations(client, projects.map((project) => project.id));

  return projects.map((project) => ({
    ...project,
    englishTranslation: translationFor(translations, "project", project.id)
  }));
}

export async function listAdminPages(): Promise<PageContent[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoPages;
  }

  const { data, error } = await client
    .from("pages")
    .select("*")
    .order("page_key", { ascending: true });

  const pages = requireAdminData(data as PageRow[] | null, error, "admin pages").map(mapPage);
  const translations = await loadAdminTranslations(client, pages.map((page) => page.id));

  return pages.map((page) => ({
    ...page,
    englishTranslation: translationFor(translations, "page", page.id)
  }));
}

export async function listAdminServices(): Promise<Service[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoServices;
  }

  const { data, error } = await client
    .from("services")
    .select("*, service_packages(*), service_addons(*)")
    .order("display_order", { ascending: true });

  const services = requireAdminData(data as ServiceRow[] | null, error, "admin services").map(mapService);
  const ids = services.flatMap((service) => [
    service.id,
    ...service.packages.map((packageItem) => packageItem.id),
    ...service.addons.map((addon) => addon.id)
  ]);
  const translations = await loadAdminTranslations(client, ids);

  return services.map((service) => ({
    ...service,
    englishTranslation: translationFor(translations, "service", service.id),
    packages: service.packages.map((packageItem) => ({
      ...packageItem,
      englishTranslation: translationFor(translations, "service_package", packageItem.id)
    })),
    addons: service.addons.map((addon) => ({
      ...addon,
      englishTranslation: translationFor(translations, "service_addon", addon.id)
    }))
  }));
}

export async function listAdminTags(): Promise<Tag[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoTags;
  }

  const { data, error } = await client.from("tags").select("*").order("title");

  const tags = requireAdminData(data as TagRow[] | null, error, "admin tags").map(mapTag);
  const translations = await loadAdminTranslations(client, tags.map((tag) => tag.id));

  return tags.map((tag) => ({
    ...tag,
    englishTranslation: translationFor(translations, "tag", tag.id)
  }));
}

export async function listAdminProjects(): Promise<Project[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoProjects.slice().sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  let { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (isMissingFeaturedColumn(error) || isMissingDisplayOrderColumn(error)) {
    const fallback = await client
      .from("projects")
      .select("*, project_services(services(*)), project_tags(tags(*))")
      .order("created_at", { ascending: false });

    data = fallback.data;
    error = fallback.error;
  }

  const projectRows = requireAdminData(data as ProjectRow[] | null, error, "admin projects");

  const projectIds = projectRows.map((project) => project.id);
  const coverImageIds = projectRows
    .map((project) => project.cover_image_id)
    .filter((imageId): imageId is string => Boolean(imageId));

  if (!projectIds.length) {
    return [];
  }

  const [{ data: relationData, error: relationError }, { data: coverData, error: coverError }] =
    await Promise.all([
      client
        .from("project_images")
        .select("project_id, sort_order, images(*)")
        .in("project_id", projectIds),
      coverImageIds.length
        ? client.from("images").select("*").in("id", coverImageIds)
        : Promise.resolve({ data: [], error: null })
    ]);

  if (isMissingProjectImagesRelation(relationError)) {
    const { data: legacyImageData, error: legacyImageError } = await client
      .from("images")
      .select("*")
      .eq("parent_type", "project")
      .in("parent_id", projectIds);

    if (legacyImageError) {
      throw new Error(`Failed to load legacy admin project media: ${legacyImageError.message}`);
    }

    return attachAdminProjectTranslations(
      client,
      attachLegacyProjectImages(
        projectRows,
        (legacyImageData as ImageRow[] | null) ?? []
      ).map(mapProject)
    );
  }

  if (relationError || coverError) {
    throw new Error(
      `Failed to load admin project media: ${relationError?.message ?? coverError?.message}`
    );
  }

  return attachAdminProjectTranslations(
    client,
    attachProjectMedia(
      projectRows,
      (relationData as Array<{
        project_id: string;
        sort_order: number | null;
        images: ImageRow | ImageRow[] | null;
      }> | null) ?? [],
      (coverData as ImageRow[] | null) ?? []
    ).map(mapProject)
  );
}

export async function listAdminImages(): Promise<PortfolioImage[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoProjects.flatMap((project) => project.gallery);
  }

  const { data, error } = await client
    .from("images")
    .select("*")
    .order("created_at", { ascending: false });

  const images = requireAdminData(data as ImageRow[] | null, error, "admin images").map(mapImage);
  const translations = await loadAdminTranslations(client, images.map((image) => image.id));

  return images.map((image) => ({
    ...image,
    englishTranslation: translationFor(translations, "image", image.id)
  }));
}

export async function listAdminAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("analytics_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (isMissingAnalyticsEventsTable(error)) {
    return [];
  }

  return requireAdminData(data as AnalyticsEventRow[] | null, error, "admin analytics events").map(
    mapAnalyticsEvent
  );
}

export async function listAdminRequests(options: {
  query?: string;
  clientUserId?: string;
  serviceId?: string;
  status?: string;
  sort?: "newest" | "oldest";
  limit?: number | null;
} = {}): Promise<OrderRequest[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    const requests = demoRequests.filter((request) => {
      const query = normalizeRequestSearch(options.query);
      const clientMatches = !options.clientUserId || request.clientUserId === options.clientUserId;
      const statusMatches = !options.status || request.status === options.status;
      const serviceMatches = !options.serviceId || request.serviceId === options.serviceId;
      const queryMatches =
        !query ||
        `${request.clientName} ${request.contactValue}`
          .toLowerCase()
          .includes(query);

      return clientMatches && statusMatches && serviceMatches && queryMatches;
    }).sort((a, b) => {
      const direction = options.sort === "oldest" ? 1 : -1;

      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    });

    return typeof options.limit === "number" ? requests.slice(0, options.limit) : requests;
  }

  const query = normalizeRequestSearch(options.query);
  const requestLimit = options.limit === undefined ? (query ? 500 : 200) : options.limit;
  const buildRequestQuery = () => {
    let requestQuery = client
      .from("requests")
      .select("*, order_contracts(*, order_contract_feedback(*)), order_attachments(*)")
      .order("created_at", { ascending: options.sort === "oldest" });

    if (options.status && isRequestStatus(options.status)) {
      requestQuery = requestQuery.eq("status", options.status);
    }

    if (options.clientUserId) {
      requestQuery = requestQuery.eq("client_user_id", options.clientUserId);
    }

    if (options.serviceId) {
      requestQuery = requestQuery.eq("service_id", options.serviceId);
    }

    return requestQuery;
  };

  let requestRows: RequestRow[] = [];

  if (requestLimit === null) {
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await buildRequestQuery().range(from, from + pageSize - 1);
      const pageRows = requireAdminData(
        data as RequestRow[] | null,
        error,
        "admin requests export"
      );

      requestRows = requestRows.concat(pageRows);

      if (pageRows.length < pageSize) {
        break;
      }
    }
  } else {
    const { data, error } = await buildRequestQuery().limit(requestLimit);

    requestRows = requireAdminData(data as RequestRow[] | null, error, "admin requests");
  }

  const rows = requestRows.map(mapRequest);

  if (!query) {
    return rows;
  }

  return rows.filter((request) =>
    `${request.clientName} ${request.contactValue}`
      .toLowerCase()
      .includes(query)
  );
}

export async function getAdminRequestById(id: string): Promise<OrderRequest | null> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoRequests.find((request) => request.id === id) ?? null;
  }

  const { data, error } = await client
    .from("requests")
    .select("*, order_contracts(*, order_contract_feedback(*)), order_attachments(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin request: ${error.message}`);
  }

  return data ? mapRequest(data as RequestRow) : null;
}

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
};

function mapProfile(profile: ProfileRow): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name ?? "",
    role: profile.role,
    createdAt: profile.created_at ?? undefined,
    updatedAt: profile.updated_at ?? undefined
  };
}

function escapeProfileSearch(query: string): string {
  return query.replace(/[^\p{L}\p{N}@._\-\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export async function listUserProfiles(options: AdminUserListOptions): Promise<AdminUserListResult> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return {
      items: [],
      total: 0,
      page: options.page,
      pageSize: options.pageSize,
      pageCount: 1
    };
  }

  const from = (options.page - 1) * options.pageSize;
  const to = from + options.pageSize - 1;
  const search = options.query ? escapeProfileSearch(options.query) : "";
  let query = client
    .from("profiles")
    .select("*", { count: "exact" });

  if (options.role) {
    query = query.eq("role", options.role);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  if (options.sort === "email") {
    query = query.order("email", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: options.sort === "oldest" });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return {
      items: [],
      total: 0,
      page: options.page,
      pageSize: options.pageSize,
      pageCount: 1
    };
  }

  const total = count ?? 0;

  return {
    items: ((data as ProfileRow[] | null) ?? []).map(mapProfile),
    total,
    page: options.page,
    pageSize: options.pageSize,
    pageCount: Math.max(1, Math.ceil(total / options.pageSize))
  };
}

export async function getUserProfileById(id: string): Promise<UserProfile | null> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user profile: ${error.message}`);
  }

  return data ? mapProfile(data as ProfileRow) : null;
}

export async function listUserRequests(clientUserId: string): Promise<OrderRequest[]> {
  return listAdminRequests({
    clientUserId,
    limit: null,
    sort: "newest"
  });
}
