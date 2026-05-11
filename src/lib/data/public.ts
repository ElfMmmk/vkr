import {
  demoPages,
  demoProjects,
  demoServices,
  demoTags
} from "@/lib/demo-data";
import {
  attachLegacyProjectImages,
  attachProjectMedia,
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
import { getOptionalSupabasePublic } from "@/lib/supabase/server";
import type { PageContent, PageKey, PortfolioFilter, Project, Service, Tag } from "@/lib/types";

function isMissingProjectImagesRelation(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("project_images"));
}

function isMissingFeaturedColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("is_featured"));
}

export function filterProjects(projects: Project[], filter: PortfolioFilter): Project[] {
  const sortDirection = filter.sort === "oldest" ? 1 : -1;

  return projects
    .filter((project) => {
      if (!project.isPublished) {
        return false;
      }

      if (filter.service && !project.services.some((service) => service.slug === filter.service)) {
        return false;
      }

      if (filter.tag && !project.tags.some((tag) => tag.slug === filter.tag)) {
        return false;
      }

      return true;
    })
    .slice()
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortDirection;
    });
}

export async function getPublicServices(): Promise<Service[]> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return demoServices.filter((service) => service.isActive);
  }

  const { data, error } = await client
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    throw new Error(`Failed to load public services: ${error?.message ?? "empty response"}`);
  }

  return (data as ServiceRow[]).map(mapService);
}

export async function getPublicTags(): Promise<Tag[]> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return demoTags;
  }

  const { data, error } = await client
    .from("tags")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) {
    throw new Error(`Failed to load public tags: ${error?.message ?? "empty response"}`);
  }

  return (data as TagRow[]).map(mapTag);
}

export async function getPublicPage(pageKey: PageKey): Promise<PageContent> {
  const fallback = demoPages.find((page) => page.pageKey === pageKey) ?? demoPages[0];
  const client = getOptionalSupabasePublic();

  if (!client) {
    return fallback;
  }

  const { data, error } = await client
    .from("pages")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load public page ${pageKey}: ${error.message}`);
  }

  if (!data) {
    return fallback;
  }

  return mapPage(data as PageRow);
}

export async function getPublicProjects(filter: PortfolioFilter = {}): Promise<Project[]> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return filterProjects(demoProjects, filter);
  }

  let { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (isMissingFeaturedColumn(error)) {
    const fallback = await client
      .from("projects")
      .select("*, project_services(services(*)), project_tags(tags(*))")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    throw new Error(`Failed to load public projects: ${error?.message ?? "empty response"}`);
  }

  const projectRows = data as ProjectRow[];
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
      throw new Error(`Failed to load legacy public project media: ${legacyImageError.message}`);
    }

    return filterProjects(
      attachLegacyProjectImages(projectRows, (legacyImageData as ImageRow[] | null) ?? []).map(
        mapProject
      ),
      filter
    );
  }

  if (relationError || coverError) {
    throw new Error(
      `Failed to load public project media: ${relationError?.message ?? coverError?.message}`
    );
  }

  return filterProjects(
    attachProjectMedia(
      projectRows,
      (relationData as Array<{
        project_id: string;
        sort_order: number | null;
        images: ImageRow | ImageRow[] | null;
      }> | null) ?? [],
      (coverData as ImageRow[] | null) ?? []
    ).map(mapProject),
    filter
  );
}

export async function getPublicProjectBySlug(slug: string): Promise<Project | null> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return demoProjects.find((project) => project.slug === slug && project.isPublished) ?? null;
  }

  const { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load public project ${slug}: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const coverImageId = (data as ProjectRow).cover_image_id;
  const [{ data: relationData, error: relationError }, { data: coverData, error: coverError }] =
    await Promise.all([
      client
        .from("project_images")
        .select("project_id, sort_order, images(*)")
        .eq("project_id", data.id),
      coverImageId
        ? client.from("images").select("*").eq("id", coverImageId).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);

  if (isMissingProjectImagesRelation(relationError)) {
    const { data: legacyImageData, error: legacyImageError } = await client
      .from("images")
      .select("*")
      .eq("parent_type", "project")
      .eq("parent_id", data.id);

    if (legacyImageError) {
      throw new Error(`Failed to load legacy public project media: ${legacyImageError.message}`);
    }

    return mapProject({
      ...(data as ProjectRow),
      images: (legacyImageData as ImageRow[] | null) ?? []
    });
  }

  if (relationError || coverError) {
    throw new Error(
      `Failed to load public project media: ${relationError?.message ?? coverError?.message}`
    );
  }

  return mapProject(
    attachProjectMedia(
      [data as ProjectRow],
      (relationData as Array<{
        project_id: string;
        sort_order: number | null;
        images: ImageRow | ImageRow[] | null;
      }> | null) ?? [],
      coverData ? [coverData as ImageRow] : []
    )[0]
  );
}
