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
  title?: string | null;
  caption: string | null;
  parent_type: "project" | "page" | "service" | "free";
  parent_id: string | null;
  sort_order: number | null;
};

export type ProjectImageRow = {
  image_id: string;
  sort_order: number | null;
  images: ImageRow | ImageRow[] | null;
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
  cover_image_id?: string | null;
  cover_image_url: string | null;
  display_order?: number | null;
  is_featured?: boolean | null;
  is_published: boolean | null;
  created_at: string;
  updated_at?: string | null;
  project_services?: { services: ServiceRow | null }[] | null;
  project_tags?: { tags: TagRow | null }[] | null;
  project_images?: ProjectImageRow[] | null;
  cover_image?: ImageRow | null;
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
    title: row.title ?? "",
    caption: row.caption ?? "",
    parentType: row.parent_type,
    parentId: row.parent_id,
    sortOrder: row.sort_order ?? 100
  };
}

function mapProjectGallery(row: ProjectRow): PortfolioImage[] {
  if (row.project_images) {
    return row.project_images
      .map((relation) => ({
        ...relation,
        image: Array.isArray(relation.images) ? relation.images[0] : relation.images
      }))
      .filter((relation): relation is ProjectImageRow & { image: ImageRow } =>
        Boolean(relation.image)
      )
      .slice()
      .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
      .map((relation) =>
        mapImage({
          ...relation.image,
          sort_order: relation.sort_order ?? relation.image.sort_order
        })
      );
  }

  return (
    row.images
      ?.slice()
      .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
      .map(mapImage) ?? []
  );
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
    coverImageId: row.cover_image_id ?? null,
    coverImageUrl: row.cover_image?.public_url ?? row.cover_image_url ?? "",
    displayOrder: row.display_order ?? 100,
    isFeatured: row.is_featured ?? false,
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
    gallery: mapProjectGallery(row)
  };
}

export function attachProjectMedia(
  rows: ProjectRow[],
  galleryRows: Array<{
    project_id: string;
    sort_order: number | null;
    images: ImageRow | ImageRow[] | null;
  }>,
  coverImages: ImageRow[] = []
): ProjectRow[] {
  const galleryByProjectId = new Map<string, ProjectImageRow[]>();
  const coverById = new Map(coverImages.map((image) => [image.id, image]));

  for (const relation of galleryRows) {
    const image = Array.isArray(relation.images) ? relation.images[0] : relation.images;

    if (!image) {
      continue;
    }

    const existing = galleryByProjectId.get(relation.project_id) ?? [];
    existing.push({
      image_id: image.id,
      sort_order: relation.sort_order,
      images: image
    });
    galleryByProjectId.set(relation.project_id, existing);
  }

  return rows.map((row) => ({
    ...row,
    cover_image: row.cover_image_id ? coverById.get(row.cover_image_id) ?? null : null,
    project_images: galleryByProjectId.get(row.id) ?? []
  }));
}

export function attachLegacyProjectImages(rows: ProjectRow[], images: ImageRow[]): ProjectRow[] {
  const imagesByProjectId = new Map<string, ImageRow[]>();

  for (const image of images) {
    if (image.parent_type !== "project" || !image.parent_id) {
      continue;
    }

    const existing = imagesByProjectId.get(image.parent_id) ?? [];
    existing.push(image);
    imagesByProjectId.set(image.parent_id, existing);
  }

  return rows.map((row) => ({
    ...row,
    images: imagesByProjectId.get(row.id) ?? []
  }));
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
