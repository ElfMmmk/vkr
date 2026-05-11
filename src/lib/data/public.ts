import {
  demoPages,
  demoProjects,
  demoServices,
  demoTags
} from "@/lib/demo-data";
import {
  attachProjectImages,
  mapPage,
  mapProject,
  mapService,
  mapTag,
  type ImageRow,
  type PageRow,
  type ProjectRow,
  type ServiceRow,
  type TagRow
} from "@/lib/data/mappers";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import type { PageContent, PageKey, PortfolioFilter, Project, Service, Tag } from "@/lib/types";

export function filterProjects(projects: Project[], filter: PortfolioFilter): Project[] {
  return projects.filter((project) => {
    if (!project.isPublished) {
      return false;
    }

    if (filter.service) {
      return project.services.some((service) => service.slug === filter.service);
    }

    if (filter.tag) {
      return project.tags.some((tag) => tag.slug === filter.tag);
    }

    return true;
  });
}

export async function getPublicServices(): Promise<Service[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoServices.filter((service) => service.isActive);
  }

  const { data, error } = await client
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    return demoServices.filter((service) => service.isActive);
  }

  return (data as ServiceRow[]).map(mapService);
}

export async function getPublicTags(): Promise<Tag[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoTags;
  }

  const { data, error } = await client
    .from("tags")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) {
    return demoTags;
  }

  return (data as TagRow[]).map(mapTag);
}

export async function getPublicPage(pageKey: PageKey): Promise<PageContent> {
  const fallback = demoPages.find((page) => page.pageKey === pageKey) ?? demoPages[0];
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return fallback;
  }

  const { data, error } = await client
    .from("pages")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (error || !data) {
    return fallback;
  }

  return mapPage(data as PageRow);
}

export async function getPublicProjects(filter: PortfolioFilter = {}): Promise<Project[]> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return filterProjects(demoProjects, filter);
  }

  const { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return filterProjects(demoProjects, filter);
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

  return filterProjects(
    attachProjectImages(projectRows, (imageData as ImageRow[] | null) ?? []).map(mapProject),
    filter
  );
}

export async function getPublicProjectBySlug(slug: string): Promise<Project | null> {
  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return demoProjects.find((project) => project.slug === slug && project.isPublished) ?? null;
  }

  const { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return demoProjects.find((project) => project.slug === slug && project.isPublished) ?? null;
  }

  const { data: imageData } = await client
    .from("images")
    .select("*")
    .eq("parent_type", "project")
    .eq("parent_id", data.id);

  return mapProject({
    ...(data as ProjectRow),
    images: (imageData as ImageRow[] | null) ?? []
  });
}
