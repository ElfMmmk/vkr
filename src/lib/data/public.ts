import {
  demoPages,
  demoProjects,
  demoServices,
  demoTags
} from "@/lib/demo-data";
import { demoEnglishTranslations } from "@/lib/demo-english-translations";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTranslationLookup,
  localizePageContent,
  localizeProjectContent,
  localizeServiceContent,
  localizeTagContent,
  type TranslationLookup
} from "@/lib/content-localization";
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
import type { TranslationEntityType } from "@/lib/entity-translations";
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

function logPublicDataError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  console.error("[public-data]", context, message);
}

type TranslationRow = {
  entity_type: TranslationEntityType;
  entity_id: string;
  fields: Record<string, unknown> | null;
};

async function loadTranslations(
  client: SupabaseClient | null,
  ids: string[],
  locale: Locale
): Promise<TranslationLookup> {
  if (!client || locale === defaultLocale || !ids.length) {
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

function serviceContentIds(services: Service[]): string[] {
  return services.flatMap((service) => [
    service.id,
    ...service.packages.map((packageItem) => packageItem.id),
    ...service.addons.map((addon) => addon.id)
  ]);
}

function projectContentIds(projects: Project[]): string[] {
  return projects.flatMap((project) => [
    project.id,
    ...serviceContentIds(project.services),
    ...project.tags.map((tag) => tag.id),
    ...project.gallery.map((image) => image.id)
  ]);
}

async function localizeServices(
  client: SupabaseClient | null,
  services: Service[],
  locale: Locale
): Promise<Service[]> {
  const translations = client
    ? await loadTranslations(client, serviceContentIds(services), locale)
    : demoEnglishTranslations;

  return services.map((service) => localizeServiceContent(service, translations, locale));
}

async function localizeProjects(
  client: SupabaseClient | null,
  projects: Project[],
  locale: Locale
): Promise<Project[]> {
  const translations = client
    ? await loadTranslations(client, projectContentIds(projects), locale)
    : demoEnglishTranslations;

  return projects.map((project) => localizeProjectContent(project, translations, locale));
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
    return localizeServices(
      null,
      demoServices.filter((service) => service.isActive),
      locale
    );
  }

  const { data, error } = await client
    .from("services")
    .select("*, service_packages(*), service_addons(*)")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    logPublicDataError("services", error ?? new Error("empty response"));

    return localizeServices(
      null,
      demoServices.filter((service) => service.isActive),
      locale
    );
  }

  const services = (data as ServiceRow[]).map(mapService);

  return localizeServices(client, services, locale);
}

export async function getPublicTags(locale: Locale = defaultLocale): Promise<Tag[]> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return demoTags.map((tag) =>
      localizeTagContent(tag, demoEnglishTranslations, locale)
    );
  }

  const { data, error } = await client
    .from("tags")
    .select("*")
    .order("title", { ascending: true });

  if (error || !data) {
    logPublicDataError("tags", error ?? new Error("empty response"));

    return demoTags.map((tag) =>
      localizeTagContent(tag, demoEnglishTranslations, locale)
    );
  }

  const tags = (data as TagRow[]).map(mapTag);
  const translations = await loadTranslations(client, tags.map((tag) => tag.id), locale);

  return tags.map((tag) => localizeTagContent(tag, translations, locale));
}

export async function getPublicPage(
  pageKey: PageKey,
  locale: Locale = defaultLocale
): Promise<PageContent> {
  const fallback = demoPages.find((page) => page.pageKey === pageKey) ?? demoPages[0];
  const client = getOptionalSupabasePublic();

  if (!client) {
    return localizePageContent(fallback, demoEnglishTranslations, locale);
  }

  const { data, error } = await client
    .from("pages")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (error) {
    logPublicDataError(`page:${pageKey}`, error);

    return localizePageContent(fallback, demoEnglishTranslations, locale);
  }

  if (!data) {
    return localizePageContent(fallback, demoEnglishTranslations, locale);
  }

  const page = mapPage(data as PageRow);
  const translations = await loadTranslations(client, [page.id], locale);

  return localizePageContent(page, translations, locale);
}

export async function getPublicProjects(
  filter: PortfolioFilter = {},
  locale: Locale = defaultLocale
): Promise<Project[]> {
  const client = getOptionalSupabasePublic();

  if (!client) {
    return filterProjects(await localizeProjects(null, demoProjects, locale), filter);
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
    logPublicDataError("projects", error ?? new Error("empty response"));

    return filterProjects(await localizeProjects(null, demoProjects, locale), filter);
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
      logPublicDataError("legacy project media", legacyImageError);

      return filterProjects(
        await localizeProjects(client, projectRows.map(mapProject), locale),
        filter
      );
    }

    const projects = attachLegacyProjectImages(projectRows, (legacyImageData as ImageRow[] | null) ?? []).map(
      mapProject
    );

    return filterProjects(await localizeProjects(client, projects, locale), filter);
  }

  if (relationError || coverError) {
    logPublicDataError("project media", relationError ?? coverError);

    return filterProjects(
      await localizeProjects(client, projectRows.map(mapProject), locale),
      filter
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
  return filterProjects(await localizeProjects(client, projects, locale), filter);
}

export async function getPublicProjectBySlug(
  slug: string,
  locale: Locale = defaultLocale
): Promise<Project | null> {
  const fallback = demoProjects.find((project) => project.slug === slug && project.isPublished) ?? null;
  const client = getOptionalSupabasePublic();

  if (!client) {
    return fallback
      ? localizeProjectContent(fallback, demoEnglishTranslations, locale)
      : null;
  }

  const { data, error } = await client
    .from("projects")
    .select("*, project_services(services(*)), project_tags(tags(*))")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    logPublicDataError(`project:${slug}`, error);

    return fallback
      ? localizeProjectContent(fallback, demoEnglishTranslations, locale)
      : null;
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
      logPublicDataError(`legacy project media:${slug}`, legacyImageError);

      const project = mapProject(data as ProjectRow);

      return (await localizeProjects(client, [project], locale))[0] ?? null;
    }

    const project = mapProject({
      ...(data as ProjectRow),
      images: (legacyImageData as ImageRow[] | null) ?? []
    });

    return (await localizeProjects(client, [project], locale))[0] ?? null;
  }

  if (relationError || coverError) {
    logPublicDataError(`project media:${slug}`, relationError ?? coverError);

    const project = mapProject(data as ProjectRow);

    return (await localizeProjects(client, [project], locale))[0] ?? null;
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

  return (await localizeProjects(client, [project], locale))[0] ?? null;
}
