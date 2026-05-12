import { demoPages, demoProjects, demoRequests, demoServices, demoTags } from "@/lib/demo-data";
import {
  attachLegacyProjectImages,
  attachProjectMedia,
  mapImage,
  mapPage,
  mapProject,
  mapRequest,
  mapService,
  mapTag,
  type ImageRow,
  type PageRow,
  type ProjectRow,
  type RequestRow,
  type ServiceRow,
  type TagRow
} from "@/lib/data/mappers";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import type {
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

export async function listAdminPages(): Promise<PageContent[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoPages;
  }

  const { data, error } = await client
    .from("pages")
    .select("*")
    .order("page_key", { ascending: true });

  return requireAdminData(data as PageRow[] | null, error, "admin pages").map(mapPage);
}

export async function listAdminServices(): Promise<Service[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoServices;
  }

  const { data, error } = await client
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  return requireAdminData(data as ServiceRow[] | null, error, "admin services").map(mapService);
}

export async function listAdminTags(): Promise<Tag[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoTags;
  }

  const { data, error } = await client.from("tags").select("*").order("title");

  return requireAdminData(data as TagRow[] | null, error, "admin tags").map(mapTag);
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

    return attachLegacyProjectImages(
      projectRows,
      (legacyImageData as ImageRow[] | null) ?? []
    ).map(mapProject);
  }

  if (relationError || coverError) {
    throw new Error(
      `Failed to load admin project media: ${relationError?.message ?? coverError?.message}`
    );
  }

  return attachProjectMedia(
    projectRows,
    (relationData as Array<{
      project_id: string;
      sort_order: number | null;
      images: ImageRow | ImageRow[] | null;
    }> | null) ?? [],
    (coverData as ImageRow[] | null) ?? []
  ).map(mapProject);
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

  return requireAdminData(data as ImageRow[] | null, error, "admin images").map(mapImage);
}

export async function listAdminRequests(options: {
  query?: string;
  serviceId?: string;
  status?: string;
  sort?: "newest" | "oldest";
} = {}): Promise<OrderRequest[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoRequests.filter((request) => {
      const query = normalizeRequestSearch(options.query);
      const statusMatches = !options.status || request.status === options.status;
      const serviceMatches = !options.serviceId || request.serviceId === options.serviceId;
      const queryMatches =
        !query ||
        `${request.clientName} ${request.contactValue}`
          .toLowerCase()
          .includes(query);

      return statusMatches && serviceMatches && queryMatches;
    }).sort((a, b) => {
      const direction = options.sort === "oldest" ? 1 : -1;

      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    });
  }

  const query = normalizeRequestSearch(options.query);
  let requestQuery = client
    .from("requests")
    .select("*")
    .order("created_at", { ascending: options.sort === "oldest" })
    .limit(query ? 500 : 200);

  if (options.status) {
    requestQuery = requestQuery.eq("status", options.status);
  }

  if (options.serviceId) {
    requestQuery = requestQuery.eq("service_id", options.serviceId);
  }

  const { data, error } = await requestQuery;
  const rows = requireAdminData(data as RequestRow[] | null, error, "admin requests").map(mapRequest);

  if (!query) {
    return rows;
  }

  return rows.filter((request) =>
    `${request.clientName} ${request.contactValue}`
      .toLowerCase()
      .includes(query)
  );
}

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function listUserProfiles(): Promise<UserProfile[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data as ProfileRow[] | null) ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name ?? "",
    role: profile.role,
    createdAt: profile.created_at ?? undefined,
    updatedAt: profile.updated_at ?? undefined
  }));
}
