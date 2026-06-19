import {
  getTranslationBlocks,
  getTranslationString,
  getTranslationStringArray,
  type TranslationEntityType
} from "@/lib/entity-translations";
import type { Locale } from "@/lib/i18n";
import type {
  PageContent,
  OrderRequest,
  PortfolioImage,
  Project,
  Service,
  ServiceAddon,
  ServicePackage,
  Tag
} from "@/lib/types";

export type TranslationLookup = Map<string, Record<string, unknown>>;

export type TranslationLookupRow = {
  entityType: TranslationEntityType;
  entityId: string;
  fields: Record<string, unknown>;
};

export function createTranslationLookup(rows: TranslationLookupRow[]): TranslationLookup {
  return new Map(
    rows.map((row) => [`${row.entityType}:${row.entityId}`, row.fields])
  );
}

function fieldsFor(
  translations: TranslationLookup,
  entityType: TranslationEntityType,
  entityId: string
): Record<string, unknown> | undefined {
  return translations.get(`${entityType}:${entityId}`);
}

function requiredText(
  fields: Record<string, unknown> | undefined,
  key: string,
  placeholder: string
): string {
  return getTranslationString(fields, key) || placeholder;
}

function optionalText(
  fields: Record<string, unknown> | undefined,
  key: string
): string {
  return getTranslationString(fields, key);
}

export function localizePageContent(
  page: PageContent,
  translations: TranslationLookup,
  locale: Locale
): PageContent {
  if (locale === "ru") {
    return page;
  }

  const fields = fieldsFor(translations, "page", page.id);

  return {
    ...page,
    title: requiredText(fields, "title", "Page"),
    body: requiredText(fields, "body", "Content is being translated."),
    blocks: getTranslationBlocks(fields)
  };
}

function localizeServicePackage(
  packageItem: ServicePackage,
  translations: TranslationLookup,
  locale: Locale
): ServicePackage {
  if (locale === "ru") {
    return packageItem;
  }

  const fields = fieldsFor(translations, "service_package", packageItem.id);

  return {
    ...packageItem,
    title: requiredText(fields, "title", "Package"),
    description: optionalText(fields, "description"),
    badge: optionalText(fields, "badge"),
    bestFor: optionalText(fields, "bestFor"),
    outcome: optionalText(fields, "outcome"),
    includedItems: getTranslationStringArray(fields, "includedItems")
  };
}

function localizeServiceAddon(
  addon: ServiceAddon,
  translations: TranslationLookup,
  locale: Locale
): ServiceAddon {
  if (locale === "ru") {
    return addon;
  }

  const fields = fieldsFor(translations, "service_addon", addon.id);

  return {
    ...addon,
    title: requiredText(fields, "title", "Add-on"),
    description: optionalText(fields, "description")
  };
}

export function localizeServiceContent(
  service: Service,
  translations: TranslationLookup,
  locale: Locale
): Service {
  if (locale === "ru") {
    return service;
  }

  const fields = fieldsFor(translations, "service", service.id);

  return {
    ...service,
    title: requiredText(fields, "title", "Service"),
    description: requiredText(fields, "description", "Description is being translated."),
    details: optionalText(fields, "details"),
    packages: service.packages.map((packageItem) =>
      localizeServicePackage(packageItem, translations, locale)
    ),
    addons: service.addons.map((addon) =>
      localizeServiceAddon(addon, translations, locale)
    )
  };
}

export function localizeTagContent(
  tag: Tag,
  translations: TranslationLookup,
  locale: Locale
): Tag {
  if (locale === "ru") {
    return tag;
  }

  const fields = fieldsFor(translations, "tag", tag.id);

  return {
    ...tag,
    title: requiredText(fields, "title", "Tag"),
    description: optionalText(fields, "description")
  };
}

function localizeImageContent(
  image: PortfolioImage,
  translations: TranslationLookup,
  locale: Locale
): PortfolioImage {
  if (locale === "ru") {
    return image;
  }

  const fields = fieldsFor(translations, "image", image.id);

  return {
    ...image,
    title: optionalText(fields, "title"),
    caption: optionalText(fields, "caption")
  };
}

export function localizeProjectContent(
  project: Project,
  translations: TranslationLookup,
  locale: Locale
): Project {
  if (locale === "ru") {
    return project;
  }

  const fields = fieldsFor(translations, "project", project.id);

  return {
    ...project,
    title: requiredText(fields, "title", "Project"),
    shortDescription: requiredText(
      fields,
      "shortDescription",
      "Project description is being translated."
    ),
    fullDescription: requiredText(
      fields,
      "fullDescription",
      "Project description is being translated."
    ),
    services: project.services.map((service) =>
      localizeServiceContent(service, translations, locale)
    ),
    tags: project.tags.map((tag) =>
      localizeTagContent(tag, translations, locale)
    ),
    gallery: project.gallery.map((image) =>
      localizeImageContent(image, translations, locale)
    )
  };
}

export function localizeOrderRequestContent(
  request: OrderRequest,
  translations: TranslationLookup,
  locale: Locale
): OrderRequest {
  if (locale === "ru") {
    return request;
  }

  const serviceFields = request.serviceId
    ? fieldsFor(translations, "service", request.serviceId)
    : undefined;
  const packageFields = request.packageId
    ? fieldsFor(translations, "service_package", request.packageId)
    : undefined;
  const projectFields = request.referenceProjectId
    ? fieldsFor(translations, "project", request.referenceProjectId)
    : undefined;

  return {
    ...request,
    serviceTitle: request.serviceId
      ? requiredText(serviceFields, "title", "Service")
      : "Service",
    packageTitle: request.packageId
      ? requiredText(packageFields, "title", "Package")
      : "Not selected",
    packageDescription: optionalText(packageFields, "description"),
    referenceProjectTitle: request.referenceProjectId
      ? requiredText(projectFields, "title", "Project")
      : "",
    selectedAddons: request.selectedAddons.map((addon) => {
      const addonFields = fieldsFor(translations, "service_addon", addon.id);

      return {
        ...addon,
        title: requiredText(addonFields, "title", "Add-on"),
        description: optionalText(addonFields, "description")
      };
    })
  };
}
