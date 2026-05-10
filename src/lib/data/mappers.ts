import type {
  OrderRequest,
  PageContent,
  PageKey,
  PortfolioImage,
  Project,
  Service,
  Tag
} from "@/lib/types";

export type ServiceRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  details: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

export type TagRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
};

export type ImageRow = {
  id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  parent_type: "project" | "page" | "service" | "free";
  parent_id: string | null;
  sort_order: number | null;
};

export type PageRow = {
  id: string;
  page_key: PageKey;
  title: string;
  body: string | null;
  blocks: Record<string, string> | null;
  updated_at?: string | null;
};

export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  cover_image_url: string | null;
  is_published: boolean | null;
  created_at: string;
  updated_at?: string | null;
  project_services?: { services: ServiceRow | null }[] | null;
  project_tags?: { tags: TagRow | null }[] | null;
  images?: ImageRow[] | null;
};

export type RequestRow = {
  id: string;
  client_name: string;
  contact_method: string;
  contact_value: string;
  service_id: string | null;
  service_title: string | null;
  comment: string | null;
  status: OrderRequest["status"];
  created_at: string;
  updated_at?: string | null;
};

export function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    details: row.details ?? "",
    displayOrder: row.display_order ?? 100,
    isActive: row.is_active ?? true
  };
}

export function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? ""
  };
}

export function mapImage(row: ImageRow): PortfolioImage {
  return {
    id: row.id,
    storagePath: row.storage_path,
    publicUrl: row.public_url ?? "",
    caption: row.caption ?? "",
    parentType: row.parent_type,
    parentId: row.parent_id,
    sortOrder: row.sort_order ?? 100
  };
}

export function mapPage(row: PageRow): PageContent {
  return {
    id: row.id,
    pageKey: row.page_key,
    title: row.title,
    body: row.body ?? "",
    blocks: row.blocks ?? {},
    updatedAt: row.updated_at ?? undefined
  };
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description ?? "",
    fullDescription: row.full_description ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    isPublished: row.is_published ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    services:
      row.project_services
        ?.map((relation) => relation.services)
        .filter((service): service is ServiceRow => Boolean(service))
        .map(mapService) ?? [],
    tags:
      row.project_tags
        ?.map((relation) => relation.tags)
        .filter((tag): tag is TagRow => Boolean(tag))
        .map(mapTag) ?? [],
    gallery:
      row.images
        ?.slice()
        .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
        .map(mapImage) ?? []
  };
}

export function mapRequest(row: RequestRow): OrderRequest {
  return {
    id: row.id,
    clientName: row.client_name,
    contactMethod: row.contact_method,
    contactValue: row.contact_value,
    serviceId: row.service_id,
    serviceTitle: row.service_title ?? "",
    comment: row.comment ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined
  };
}
