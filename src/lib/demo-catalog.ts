import catalog from "@/lib/demo-catalog.json";
import type { Project, Service, Tag } from "@/lib/types";

type CatalogPackage = {
  id: string;
  title: string;
  description: string;
  badge: string;
  bestFor: string;
  outcome: string;
  includedItems: string[];
  priceFrom: number;
  priceTo: number;
  durationFromDays: number;
  durationToDays: number;
  isRecommended?: boolean;
};

type CatalogAddon = {
  id: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
};

type CatalogService = {
  id: string;
  title: string;
  slug: string;
  description: string;
  details: string;
  packages: CatalogPackage[];
  addons: CatalogAddon[];
};

type CatalogProject = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  cover: string;
  gallery: string[];
  serviceSlugs: string[];
  tagSlugs: string[];
  featured: boolean;
};

const typedCatalog = catalog as {
  services: CatalogService[];
  projects: CatalogProject[];
};

const assetRoot = "/assets/demo-projects";
const projectDates: Record<string, string> = {
  "studio-frame": "2026-03-24T00:00:00.000Z",
  "north-coffee-roasters": "2026-04-18T00:00:00.000Z",
  "urban-forum-deck": "2026-05-01T00:00:00.000Z",
  "botanica-lab": "2026-05-10T00:00:00.000Z"
};

export const catalogTags: Tag[] = [
  {
    id: "tag-branding",
    title: "Брендинг",
    slug: "branding",
    description: "Проекты с визуальной системой бренда"
  },
  {
    id: "tag-digital",
    title: "Digital",
    slug: "digital",
    description: "Материалы для онлайн-коммуникации"
  },
  {
    id: "tag-print",
    title: "Печать",
    slug: "print",
    description: "Печатные и упаковочные носители"
  },
  {
    id: "tag-minimal",
    title: "Минимализм",
    slug: "minimal",
    description: "Сдержанная визуальная подача"
  }
];

export const catalogServices: Service[] = typedCatalog.services.map((service, serviceIndex) => ({
  id: service.id,
  title: service.title,
  slug: service.slug,
  description: service.description,
  details: service.details,
  displayOrder: (serviceIndex + 1) * 10,
  isActive: true,
  packages: service.packages.map((item, itemIndex) => ({
    ...item,
    serviceId: service.id,
    displayOrder: (itemIndex + 1) * 10,
    isActive: true,
    isRecommended: Boolean(item.isRecommended)
  })),
  addons: service.addons.map((item, itemIndex) => ({
    ...item,
    serviceId: service.id,
    displayOrder: (itemIndex + 1) * 10,
    isActive: true
  }))
}));

export const catalogProjects: Project[] = typedCatalog.projects.map((project, projectIndex) => ({
  id: project.id,
  title: project.title,
  slug: project.slug,
  shortDescription: project.shortDescription,
  fullDescription: project.fullDescription,
  coverImageId: `${project.id}-cover`,
  coverImageUrl: `${assetRoot}/${project.cover}`,
  displayOrder: (projectIndex + 1) * 10,
  isFeatured: project.featured,
  isPublished: true,
  createdAt: projectDates[project.slug] ?? `2026-05-${String(12 + projectIndex).padStart(2, "0")}T00:00:00.000Z`,
  services: catalogServices.filter((service) => project.serviceSlugs.includes(service.slug)),
  tags: catalogTags.filter((tag) => project.tagSlugs.includes(tag.slug)),
  gallery: project.gallery.map((fileName, imageIndex) => ({
    id: `${project.id}-gallery-${imageIndex + 1}`,
    storagePath: `demo-projects/${fileName}`,
    publicUrl: `${assetRoot}/${fileName}`,
    title: project.title,
    caption: `Материал проекта ${project.title}`,
    parentType: "project",
    parentId: project.id,
    sortOrder: imageIndex + 1
  }))
}));
