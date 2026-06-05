import type {
  OrderRequest,
  OrderAddonSnapshot,
  OrderContract,
  AnalyticsEvent,
  PageContent,
  PageKey,
  PortfolioImage,
  Project,
  Service,
  ServiceAddon,
  ServicePackage,
  Tag
} from "@/lib/types";
import type { Json, Tables } from "@/lib/supabase/database.types";

export type ServicePackageRow = Tables<"service_packages">;
export type ServiceAddonRow = Tables<"service_addons">;
export type AnalyticsEventRow = Tables<"analytics_events">;
export type ServiceRow = Tables<"services"> & {
  service_packages?: ServicePackageRow[] | null;
  service_addons?: ServiceAddonRow[] | null;
};
export type TagRow = Tables<"tags">;
export type ImageRow = Tables<"images">;
export type OrderContractRow = Tables<"order_contracts">;

export type ProjectImageRow = {
  image_id: string;
  sort_order: number | null;
  images: ImageRow | ImageRow[] | null;
};

export type PageRow = Omit<Tables<"pages">, "blocks" | "page_key"> & {
  blocks: Json | null;
  page_key: PageKey;
};

export type ProjectRow = Tables<"projects"> & {
  project_services?: { services: ServiceRow | null }[] | null;
  project_tags?: { tags: TagRow | null }[] | null;
  project_images?: ProjectImageRow[] | null;
  cover_image?: ImageRow | null;
  images?: ImageRow[] | null;
};

export type RequestRow = Tables<"requests"> & {
  order_contracts?: OrderContractRow | OrderContractRow[] | null;
};

function mapJsonRecord(value: Json | null): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

export function mapAnalyticsEvent(row: AnalyticsEventRow): AnalyticsEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    path: row.path,
    search: row.search ?? "",
    referrer: row.referrer ?? "",
    href: row.href ?? "",
    label: row.label ?? "",
    sourceHash: row.source_hash ?? "",
    metadata: mapJsonRecord(row.metadata),
    createdAt: row.created_at
  };
}

export function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    details: row.details ?? "",
    displayOrder: row.display_order ?? 100,
    isActive: row.is_active ?? true,
    packages:
      row.service_packages
        ?.slice()
        .sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100))
        .map(mapServicePackage) ?? [],
    addons:
      row.service_addons
        ?.slice()
        .sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100))
        .map(mapServiceAddon) ?? []
  };
}

export function mapServicePackage(row: ServicePackageRow): ServicePackage {
  return {
    id: row.id,
    serviceId: row.service_id,
    title: row.title,
    description: row.description ?? "",
    priceFrom: row.price_from ?? 0,
    priceTo: row.price_to ?? 0,
    durationFromDays: row.duration_from_days ?? 1,
    durationToDays: row.duration_to_days ?? 1,
    displayOrder: row.display_order ?? 100,
    isActive: row.is_active ?? true
  };
}

export function mapServiceAddon(row: ServiceAddonRow): ServiceAddon {
  return {
    id: row.id,
    serviceId: row.service_id,
    title: row.title,
    description: row.description ?? "",
    price: row.price ?? 0,
    durationDays: row.duration_days ?? 0,
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
    blocks: mapJsonRecord(row.blocks),
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
  const contractRows = row.order_contracts;
  const contract = Array.isArray(contractRows) ? contractRows[0] : contractRows;

  return {
    id: row.id,
    clientUserId: row.client_user_id ?? null,
    clientName: row.client_name,
    contactMethod: row.contact_method,
    contactValue: row.contact_value,
    serviceId: row.service_id,
    serviceTitle: row.service_title ?? "",
    packageId: row.package_id ?? null,
    packageTitle: row.package_title ?? "",
    packageDescription: row.package_description ?? "",
    packagePriceFrom: row.package_price_from ?? null,
    packagePriceTo: row.package_price_to ?? null,
    packageDurationFromDays: row.package_duration_from_days ?? null,
    packageDurationToDays: row.package_duration_to_days ?? null,
    selectedAddons: mapOrderAddonSnapshots(row.selected_addons),
    referenceProjectId: row.reference_project_id ?? null,
    referenceProjectTitle: row.reference_project_title ?? "",
    referenceProjectSlug: row.reference_project_slug ?? "",
    resultDescription: row.result_description ?? "",
    stylePreferences: row.style_preferences ?? "",
    materials: row.materials ?? "",
    desiredDeadline: row.desired_deadline ?? "",
    estimatedPriceFrom: row.estimated_price_from ?? null,
    estimatedPriceTo: row.estimated_price_to ?? null,
    estimatedDurationFromDays: row.estimated_duration_from_days ?? null,
    estimatedDurationToDays: row.estimated_duration_to_days ?? null,
    comment: row.comment ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    contract: contract ? mapOrderContract(contract) : null
  };
}

function mapOrderAddonSnapshots(value: Json): OrderAddonSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, Json | undefined>;
      const id = typeof record.id === "string" ? record.id : "";
      const title = typeof record.title === "string" ? record.title : "";

      if (!id || !title) {
        return null;
      }

      return {
        id,
        title,
        description: typeof record.description === "string" ? record.description : "",
        price: typeof record.price === "number" ? record.price : 0,
        durationDays: typeof record.durationDays === "number" ? record.durationDays : 0
      };
    })
    .filter((item): item is OrderAddonSnapshot => Boolean(item));
}

export function mapOrderContract(row: OrderContractRow): OrderContract {
  return {
    id: row.id,
    requestId: row.request_id,
    finalPrice: row.final_price ?? 0,
    finalDurationDays: row.final_duration_days ?? 1,
    workScope: row.work_scope ?? "",
    materials: row.materials ?? "",
    managerComment: row.manager_comment ?? "",
    status: row.status,
    acceptedAt: row.accepted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined
  };
}
