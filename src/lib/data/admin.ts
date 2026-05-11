import { demoPages, demoProjects, demoRequests, demoServices, demoTags } from "@/lib/demo-data";
import {
  attachProjectImages,
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
  Tag
} from "@/lib/types";

export async function listAdminPages(): Promise<PageContent[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoPages;
  }

  const { data, error } = await client
    .from("pages")
    .select("*")
    .order("page_key", { ascending: true });

  if (error || !data) {
    return demoPages;
  }

  return (data as PageRow[]).map(mapPage);
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

  if (error || !data) {
    return demoServices;
  }

  return (data as ServiceRow[]).map(mapService);
}

export async function listAdminTags(): Promise<Tag[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoTags;
  }

  const { data, error } = await client.from("tags").select("*").order("title");

  if (error || !data) {
    return demoTags;
  }

  return (data as TagRow[]).map(mapTag);
}

export async function listAdminProjects(): Promise<Project[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoProjects;
  }

  const { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return demoProjects;
  }

  const projectRows = data as ProjectRow[];
  const projectIds = projectRows.map((project) => project.id);

  if (!projectIds.length) {
    return [];
  }

  const { data: imageData } = await client
    .from("images")
    .select("*")
    .eq("parent_type", "project")
    .in("parent_id", projectIds);

  return attachProjectImages(projectRows, (imageData as ImageRow[] | null) ?? []).map(mapProject);
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

  if (error || !data) {
    return [];
  }

  return (data as ImageRow[]).map(mapImage);
}

export async function listAdminRequests(options: {
  query?: string;
  status?: string;
} = {}): Promise<OrderRequest[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoRequests.filter((request) => {
      const query = options.query?.toLowerCase();
      const statusMatches = !options.status || request.status === options.status;
      const queryMatches =
        !query ||
        `${request.clientName} ${request.contactValue} ${request.serviceTitle}`
          .toLowerCase()
          .includes(query);

      return statusMatches && queryMatches;
    });
  }

  let requestQuery = client
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    requestQuery = requestQuery.eq("status", options.status);
  }

  if (options.query) {
    requestQuery = requestQuery.or(
      `client_name.ilike.%${options.query}%,contact_value.ilike.%${options.query}%,service_title.ilike.%${options.query}%`
    );
  }

  const { data, error } = await requestQuery;

  if (error || !data) {
    return demoRequests;
  }

  return (data as RequestRow[]).map(mapRequest);
}
