import { describe, expect, it } from "vitest";

import {
  createTranslationLookup,
  localizeOrderRequestContent,
  localizePageContent,
  localizeProjectContent,
  localizeServiceContent
} from "@/lib/content-localization";
import type { OrderRequest, PageContent, Project, Service } from "@/lib/types";

const service: Service = {
  id: "service-1",
  title: "Айдентика",
  slug: "identity",
  description: "Русское описание",
  details: "Русский состав",
  displayOrder: 10,
  isActive: true,
  packages: [
    {
      id: "package-1",
      serviceId: "service-1",
      title: "Пакет",
      description: "Описание пакета",
      badge: "Популярный",
      bestFor: "Для запуска",
      outcome: "Готовая система",
      includedItems: ["Логотип"],
      priceFrom: 1,
      priceTo: 2,
      durationFromDays: 3,
      durationToDays: 4,
      displayOrder: 10,
      isActive: true,
      isRecommended: true,
      recommendationTags: {}
    }
  ],
  addons: [
    {
      id: "addon-1",
      serviceId: "service-1",
      title: "Дополнение",
      description: "Описание дополнения",
      price: 1,
      durationDays: 1,
      displayOrder: 10,
      isActive: true
    }
  ]
};

describe("public content localization", () => {
  it("localizes nested service content from entity translations", () => {
    const translations = createTranslationLookup([
      {
        entityType: "service",
        entityId: "service-1",
        fields: {
          title: "Brand identity",
          description: "English description",
          details: "English scope"
        }
      },
      {
        entityType: "service_package",
        entityId: "package-1",
        fields: {
          title: "Identity package",
          description: "Package description",
          badge: "Popular",
          bestFor: "For launch",
          outcome: "Ready system",
          includedItems: ["Logo"]
        }
      },
      {
        entityType: "service_addon",
        entityId: "addon-1",
        fields: {
          title: "Extra templates",
          description: "Editable templates"
        }
      }
    ]);

    const localized = localizeServiceContent(service, translations, "en");

    expect(localized.title).toBe("Brand identity");
    expect(localized.packages[0]).toMatchObject({
      title: "Identity package",
      badge: "Popular",
      includedItems: ["Logo"]
    });
    expect(localized.addons[0]?.title).toBe("Extra templates");
  });

  it("never exposes Russian base content when an English translation is missing", () => {
    const localized = localizeServiceContent(service, createTranslationLookup([]), "en");

    expect(localized).toMatchObject({
      title: "Service",
      description: "Description is being translated.",
      details: ""
    });
    expect(localized.packages[0]).toMatchObject({
      title: "Package",
      description: "",
      includedItems: []
    });
    expect(JSON.stringify(localized)).not.toContain("Русск");
    expect(JSON.stringify(localized)).not.toContain("Айдентика");
    expect(JSON.stringify(localized)).not.toContain("Логотип");
  });

  it("uses only translated page blocks in English mode", () => {
    const page: PageContent = {
      id: "page-1",
      pageKey: "home",
      title: "Главная",
      body: "Русский текст",
      blocks: {
        cta: "Обсудить проект",
        secondaryCta: "Портфолио"
      }
    };
    const translations = createTranslationLookup([
      {
        entityType: "page",
        entityId: "page-1",
        fields: {
          title: "Home",
          body: "English text",
          blocks: { cta: "Start a project" }
        }
      }
    ]);

    expect(localizePageContent(page, translations, "en")).toMatchObject({
      title: "Home",
      body: "English text",
      blocks: { cta: "Start a project" }
    });
  });

  it("localizes project relations and image captions", () => {
    const project: Project = {
      id: "project-1",
      title: "Проект",
      slug: "project",
      shortDescription: "Коротко",
      fullDescription: "Подробно",
      coverImageId: null,
      coverImageUrl: "",
      displayOrder: 10,
      isFeatured: true,
      isPublished: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      services: [service],
      tags: [
        {
          id: "tag-1",
          title: "Брендинг",
          slug: "branding",
          description: "Описание"
        }
      ],
      gallery: [
        {
          id: "image-1",
          storagePath: "image.png",
          publicUrl: "/image.png",
          title: "Изображение",
          caption: "Подпись",
          parentType: "project",
          parentId: "project-1",
          sortOrder: 1
        }
      ]
    };
    const translations = createTranslationLookup([
      {
        entityType: "project",
        entityId: "project-1",
        fields: {
          title: "Project",
          shortDescription: "Short",
          fullDescription: "Full"
        }
      },
      {
        entityType: "tag",
        entityId: "tag-1",
        fields: { title: "Branding", description: "Description" }
      },
      {
        entityType: "image",
        entityId: "image-1",
        fields: { title: "Image", caption: "Caption" }
      }
    ]);

    const localized = localizeProjectContent(project, translations, "en");

    expect(localized.title).toBe("Project");
    expect(localized.tags[0]?.title).toBe("Branding");
    expect(localized.gallery[0]).toMatchObject({ title: "Image", caption: "Caption" });
    expect(localized.services[0]?.title).toBe("Service");
  });

  it("localizes order snapshots by stable ids without translating user-authored text", () => {
    const request: OrderRequest = {
      id: "request-1",
      attachments: [],
      clientName: "Anna",
      contactMethod: "Email",
      contactValue: "anna@example.test",
      serviceId: "service-1",
      serviceTitle: "Айдентика",
      packageId: "package-1",
      packageTitle: "Пакет",
      packageDescription: "Описание пакета",
      packagePriceFrom: 100,
      packagePriceTo: 200,
      packageDurationFromDays: 3,
      packageDurationToDays: 5,
      selectedAddons: [
        {
          id: "addon-1",
          title: "Дополнение",
          description: "Описание дополнения",
          price: 50,
          durationDays: 1
        }
      ],
      referenceProjectId: "project-1",
      referenceProjectTitle: "Проект",
      referenceProjectSlug: "project",
      resultDescription: "Пользовательский текст",
      stylePreferences: "Минимализм",
      materials: "Логотип и фотографии",
      desiredDeadline: "К концу месяца",
      estimatedPriceFrom: 150,
      estimatedPriceTo: 250,
      estimatedDurationFromDays: 4,
      estimatedDurationToDays: 6,
      comment: "Комментарий пользователя",
      status: "new",
      createdAt: "2026-06-19T10:00:00.000Z",
      statusHistory: []
    };
    const translations = createTranslationLookup([
      {
        entityType: "service",
        entityId: "service-1",
        fields: { title: "Brand identity" }
      },
      {
        entityType: "service_package",
        entityId: "package-1",
        fields: { title: "Identity package", description: "Package description" }
      },
      {
        entityType: "service_addon",
        entityId: "addon-1",
        fields: { title: "Extra templates", description: "Editable templates" }
      },
      {
        entityType: "project",
        entityId: "project-1",
        fields: { title: "Reference project" }
      }
    ]);

    const localized = localizeOrderRequestContent(request, translations, "en");

    expect(localized).toMatchObject({
      serviceTitle: "Brand identity",
      packageTitle: "Identity package",
      packageDescription: "Package description",
      referenceProjectTitle: "Reference project"
    });
    expect(localized.selectedAddons[0]).toMatchObject({
      title: "Extra templates",
      description: "Editable templates"
    });
    expect(localized.resultDescription).toBe("Пользовательский текст");
    expect(localized.stylePreferences).toBe("Минимализм");
    expect(localized.materials).toBe("Логотип и фотографии");
    expect(localized.comment).toBe("Комментарий пользователя");
  });

  it("uses English placeholders for missing order snapshot translations", () => {
    const request = {
      id: "request-2",
      attachments: [],
      clientName: "Anna",
      contactMethod: "Email",
      contactValue: "anna@example.test",
      serviceId: "service-1",
      serviceTitle: "Русская услуга",
      packageId: "package-1",
      packageTitle: "Русский пакет",
      packageDescription: "Русское описание",
      packagePriceFrom: 100,
      packagePriceTo: 200,
      packageDurationFromDays: 3,
      packageDurationToDays: 5,
      selectedAddons: [
        {
          id: "addon-1",
          title: "Русское дополнение",
          description: "Русское описание",
          price: 50,
          durationDays: 1
        }
      ],
      referenceProjectId: "project-1",
      referenceProjectTitle: "Русский проект",
      referenceProjectSlug: "project",
      resultDescription: "User text",
      stylePreferences: "",
      materials: "",
      desiredDeadline: "",
      estimatedPriceFrom: 150,
      estimatedPriceTo: 250,
      estimatedDurationFromDays: 4,
      estimatedDurationToDays: 6,
      comment: "",
      status: "new",
      createdAt: "2026-06-19T10:00:00.000Z"
    } satisfies OrderRequest;

    const localized = localizeOrderRequestContent(
      request,
      createTranslationLookup([]),
      "en"
    );

    expect(localized).toMatchObject({
      serviceTitle: "Service",
      packageTitle: "Package",
      packageDescription: "",
      referenceProjectTitle: "Project"
    });
    expect(localized.selectedAddons[0]).toMatchObject({
      title: "Add-on",
      description: ""
    });
    expect(JSON.stringify(localized)).not.toContain("Русск");
  });
});
