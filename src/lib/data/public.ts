import {
  demoPages,
  demoProjects,
  demoServices,
  demoTags
} from "@/lib/demo-data";
import type { SupabaseClient } from "@supabase/supabase-js";
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
import { defaultLocale, type Locale } from "@/lib/i18n";
import type { PageContent, PageKey, PortfolioFilter, Project, Service, Tag } from "@/lib/types";

function isMissingProjectImagesRelation(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("project_images"));
}

function isMissingFeaturedColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("is_featured"));
}

function isMissingDisplayOrderColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("display_order"));
}

type TranslationRow = {
  entity_id: string;
  fields: Record<string, unknown> | null;
};

async function loadTranslations(
  client: SupabaseClient | null,
  entityType: string,
  ids: string[],
  locale: Locale
): Promise<Map<string, Record<string, unknown>>> {
  if (!client || locale === defaultLocale || !ids.length) {
    return new Map();
  }

  const { data, error } = await client
    .from("entity_translations")
    .select("entity_id, fields")
    .eq("entity_type", entityType)
    .eq("locale", locale)
    .in("entity_id", ids);

  if (error) {
    return new Map();
  }

  return new Map(
    ((data as TranslationRow[] | null) ?? []).map((row) => [row.entity_id, row.fields ?? {}])
  );
}

function translatedString(
  fields: Record<string, unknown> | undefined,
  key: string,
  fallback: string
): string {
  const value = fields?.[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

function localizePage(page: PageContent, fields?: Record<string, unknown>): PageContent {
  return {
    ...page,
    title: translatedString(fields, "title", page.title),
    body: translatedString(fields, "body", page.body),
    blocks:
      fields && typeof fields.blocks === "object" && fields.blocks
        ? { ...page.blocks, ...(fields.blocks as Record<string, string>) }
        : page.blocks
  };
}

function localizeService(service: Service, fields?: Record<string, unknown>): Service {
  return {
    ...service,
    title: translatedString(fields, "title", service.title),
    description: translatedString(fields, "description", service.description),
    details: translatedString(fields, "details", service.details)
  };
}

function localizeTag(tag: Tag, fields?: Record<string, unknown>): Tag {
  return {
    ...tag,
    title: translatedString(fields, "title", tag.title),
    description: translatedString(fields, "description", tag.description)
  };
}

function localizeProject(project: Project, fields?: Record<string, unknown>): Project {
  return {
    ...project,
    title: translatedString(fields, "title", project.title),
    shortDescription: translatedString(fields, "shortDescription", project.shortDescription),
    fullDescription: translatedString(fields, "fullDescription", project.fullDescription)
  };
}

export function filterProjects(projects: Project[], filter: PortfolioFilter): Project[] {
  const serviceSlugs = filter.services?.length
    ? filter.services
    : filter.service
      ? [filter.service]
      : [];
  const tagSlugs = filter.tags?.length ? filter.tags : filter.tag ? [filter.tag] : [];
  const sort = filter.sort ?? "default";
  const sortDirection = sort === "oldest" ? 1 : -1;

  return projects
    .filter((project) => {
      if (!project.isPublished) {
        return false;
      }

      if (
        serviceSlugs.length &&
        !project.services.some((service) => serviceSlugs.includes(service.slug))
      ) {
        return false;
      }

      if (tagSlugs.length && !project.tags.some((tag) => tagSlugs.includes(tag.slug))) {
        return false;
      }

      return true;
    })
    .slice()
    .sort((a, b) => {
      if (sort === "default" && a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      if (sort === "default" && a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }

      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortDirection;
    });
}

export async function getPublicServices(locale: Locale = defaultLocale): Promise<Service[]> {
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

  const services = (data as ServiceRow[]).map(mapService);
  const translations = await loadTranslations(client, "service", services.map((service) => service.id), locale);

  return services.map((service) => localizeService(service, translations.get(service.id)));
}

export async function getPublicTags(locale: Locale = defaultLocale): Promise<Tag[]> {
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

  const tags = (data as TagRow[]).map(mapTag);
  const translations = await loadTranslations(client, "tag", tags.map((tag) => tag.id), locale);

  return tags.map((tag) => localizeTag(tag, translations.get(tag.id)));
}

export async function getPublicPage(
  pageKey: PageKey,
  locale: Locale = defaultLocale
): Promise<PageContent> {
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

  const page = mapPage(data as PageRow);
  const translations = await loadTranslations(client, "page", [page.id], locale);

  return localizePage(page, translations.get(page.id));
}

export async function getPublicProjects(
  filter: PortfolioFilter = {},
  locale: Locale = defaultLocale
): Promise<Project[]> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return filterProjects(demoProjects, filter);
  }

  let { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (isMissingFeaturedColumn(error) || isMissingDisplayOrderColumn(error)) {
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

    const projects = attachLegacyProjectImages(projectRows, (legacyImageData as ImageRow[] | null) ?? []).map(
      mapProject
    );
    const translations = await loadTranslations(client, "project", projects.map((project) => project.id), locale);

    return filterProjects(projects.map((project) => localizeProject(project, translations.get(project.id))), filter);
  }

  if (relationError || coverError) {
    throw new Error(
      `Failed to load public project media: ${relationError?.message ?? coverError?.message}`
    );
  }

  const projects = attachProjectMedia(
      projectRows,
      (relationData as Array<{
        project_id: string;
        sort_order: number | null;
        images: ImageRow | ImageRow[] | null;
      }> | null) ?? [],
      (coverData as ImageRow[] | null) ?? []
    ).map(mapProject);
  const translations = await loadTranslations(client, "project", projects.map((project) => project.id), locale);

  return filterProjects(projects.map((project) => localizeProject(project, translations.get(project.id))), filter);
}

export async function getPublicProjectBySlug(
  slug: string,
  locale: Locale = defaultLocale
): Promise<Project | null> {
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

    const project = mapProject({
      ...(data as ProjectRow),
      images: (legacyImageData as ImageRow[] | null) ?? []
    });
    const translations = await loadTranslations(client, "project", [project.id], locale);

    return localizeProject(project, translations.get(project.id));
  }

  if (relationError || coverError) {
    throw new Error(
      `Failed to load public project media: ${relationError?.message ?? coverError?.message}`
    );
  }

  const project = mapProject(
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
  const translations = await loadTranslations(client, "project", [project.id], locale);

  return localizeProject(project, translations.get(project.id));
}
