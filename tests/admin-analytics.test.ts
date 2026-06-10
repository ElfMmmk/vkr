import { describe, expect, it } from "vitest";

import {
  buildAdminAnalytics,
  parseAdminAnalyticsPeriod,
  toAdminAnalyticsSearchParams
} from "@/lib/admin-analytics";
import type {
  AnalyticsEvent,
  OrderRequest,
  PortfolioImage,
  Project,
  Service
} from "@/lib/types";

const now = new Date("2026-06-03T12:00:00.000Z");

function request(overrides: Partial<OrderRequest>): OrderRequest {
  return {
    id: "request-base",
    clientName: "Client",
    contactMethod: "Email",
    contactValue: "client@example.com",
    serviceId: "svc-brand",
    serviceTitle: "Brand",
    packageId: null,
    packageTitle: "",
    packageDescription: "",
    packagePriceFrom: null,
    packagePriceTo: null,
    packageDurationFromDays: null,
    packageDurationToDays: null,
    selectedAddons: [],
    referenceProjectId: null,
    referenceProjectTitle: "",
    referenceProjectSlug: "",
    resultDescription: "Brief",
    stylePreferences: "",
    materials: "",
    desiredDeadline: "",
    estimatedPriceFrom: 10000,
    estimatedPriceTo: 20000,
    estimatedDurationFromDays: null,
    estimatedDurationToDays: null,
    comment: "",
    status: "new",
    createdAt: "2026-06-01T10:00:00.000Z",
    attachments: [],
    ...overrides
  };
}

const services = [
  {
    id: "svc-brand",
    title: "Brand",
    slug: "brand",
    description: "",
    details: "",
    displayOrder: 10,
    isActive: true,
    packages: [],
    addons: []
  },
  {
    id: "svc-web",
    title: "Website",
    slug: "website",
    description: "",
    details: "",
    displayOrder: 20,
    isActive: true,
    packages: [],
    addons: []
  }
] satisfies Service[];

const projects = [
  {
    id: "project-1",
    title: "Project",
    slug: "project",
    shortDescription: "",
    fullDescription: "",
    coverImageId: null,
    coverImageUrl: "",
    displayOrder: 10,
    isFeatured: true,
    isPublished: true,
    createdAt: "2026-05-01T00:00:00.000Z",
    services: [],
    tags: [],
    gallery: []
  }
] satisfies Project[];

const images = [
  {
    id: "image-1",
    storagePath: "image.png",
    publicUrl: "/image.png",
    title: "Image",
    caption: "",
    parentType: "project",
    parentId: "project-1",
    sortOrder: 10
  }
] satisfies PortfolioImage[];

const analyticsEvents = [
  {
    id: "view-home-1",
    eventType: "page_view",
    path: "/",
    search: "",
    referrer: "",
    href: "",
    label: "",
    sourceHash: "visitor-a",
    metadata: {},
    createdAt: "2026-06-02T08:00:00.000Z"
  },
  {
    id: "view-home-2",
    eventType: "page_view",
    path: "/",
    search: "",
    referrer: "",
    href: "",
    label: "",
    sourceHash: "visitor-b",
    metadata: {},
    createdAt: "2026-06-02T09:00:00.000Z"
  },
  {
    id: "view-services",
    eventType: "page_view",
    path: "/services",
    search: "",
    referrer: "",
    href: "",
    label: "",
    sourceHash: "visitor-a",
    metadata: {},
    createdAt: "2026-06-03T09:00:00.000Z"
  },
  {
    id: "cta-order",
    eventType: "cta_click",
    path: "/services",
    search: "",
    referrer: "",
    href: "/order?service=brand",
    label: "Заказать",
    sourceHash: "visitor-a",
    metadata: {},
    createdAt: "2026-06-03T09:05:00.000Z"
  },
  {
    id: "outside-period-event",
    eventType: "page_view",
    path: "/old",
    search: "",
    referrer: "",
    href: "",
    label: "",
    sourceHash: "visitor-old",
    metadata: {},
    createdAt: "2026-04-01T09:00:00.000Z"
  }
] satisfies AnalyticsEvent[];

describe("admin analytics helpers", () => {
  it("normalizes supported analytics periods", () => {
    expect(parseAdminAnalyticsPeriod("7")).toBe("7");
    expect(parseAdminAnalyticsPeriod("90")).toBe("90");
    expect(parseAdminAnalyticsPeriod("all")).toBe("all");
    expect(parseAdminAnalyticsPeriod("bad")).toBe("30");
    expect(toAdminAnalyticsSearchParams("30").toString()).toBe("");
    expect(toAdminAnalyticsSearchParams("90").toString()).toBe("period=90");
  });

  it("builds period-scoped KPI, distributions, trend, and attention items", () => {
    const analytics = buildAdminAnalytics({
      images,
      analyticsEvents,
      now,
      period: "30",
      projects,
      requests: [
        request({
          id: "new-recent",
          status: "new",
          serviceId: "svc-brand",
          serviceTitle: "Brand",
          createdAt: "2026-06-02T10:00:00.000Z",
          estimatedPriceFrom: 20000,
          estimatedPriceTo: 40000
        }),
        request({
          id: "accepted-contract",
          status: "approved",
          serviceId: "svc-web",
          serviceTitle: "Website",
          createdAt: "2026-05-30T10:00:00.000Z",
          estimatedPriceFrom: 60000,
          estimatedPriceTo: 60000,
          contract: {
            id: "contract-accepted",
            requestId: "accepted-contract",
            finalPrice: 75000,
            finalDurationDays: 12,
            workScope: "",
            materials: "",
            managerComment: "",
            status: "accepted",
            acceptedAt: "2026-06-01T10:00:00.000Z",
            createdAt: "2026-05-31T10:00:00.000Z"
          }
        }),
        request({
          id: "sent-contract",
          status: "in_progress",
          serviceId: "svc-web",
          serviceTitle: "Website",
          createdAt: "2026-05-25T10:00:00.000Z",
          contract: {
            id: "contract-sent",
            requestId: "sent-contract",
            finalPrice: 55000,
            finalDurationDays: 10,
            workScope: "",
            materials: "",
            managerComment: "",
            status: "sent",
            acceptedAt: null,
            createdAt: "2026-05-26T10:00:00.000Z"
          }
        }),
        request({
          id: "outside-period",
          status: "completed",
          serviceId: "svc-brand",
          serviceTitle: "Brand",
          createdAt: "2026-04-20T10:00:00.000Z"
        })
      ],
      services
    });

    expect(analytics.kpis.totalRequests).toBe(3);
    expect(analytics.kpis.newRequests).toBe(1);
    expect(analytics.kpis.acceptedContracts).toBe(1);
    expect(analytics.kpis.acceptedContractValue).toBe(75000);
    expect(analytics.kpis.averageEstimate).toBe(35000);
    expect(analytics.kpis.publishedProjects).toBe(1);
    expect(analytics.kpis.mediaFiles).toBe(1);
    expect(analytics.traffic.totalPageViews).toBe(3);
    expect(analytics.traffic.uniqueVisitors).toBe(2);
    expect(analytics.traffic.ctaClicks).toBe(1);
    expect(analytics.traffic.ctaClickRate).toBe(33);
    expect(analytics.traffic.topPages).toEqual([
      { path: "/", views: 2 },
      { path: "/services", views: 1 }
    ]);
    expect(analytics.traffic.topCtas).toEqual([
      { href: "/order?service=brand", label: "Заказать", clicks: 1 }
    ]);
    expect(analytics.statuses.find((item) => item.status === "completed")?.count).toBe(0);
    expect(analytics.services.map((item) => [item.title, item.count])).toEqual([
      ["Website", 2],
      ["Brand", 1]
    ]);
    expect(analytics.trend).toHaveLength(30);
    expect(analytics.trend.at(-1)?.key).toBe("2026-06-03");
    expect(analytics.attentionItems.map((item) => item.reason)).toEqual([
      "new_request",
      "sent_contract",
      "stale_in_progress"
    ]);
  });
});
