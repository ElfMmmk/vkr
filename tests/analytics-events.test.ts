import { describe, expect, it } from "vitest";

import {
  buildAnalyticsEventInsert,
  createAnalyticsSourceHash,
  parseAnalyticsEventPayload
} from "@/lib/analytics-events";

describe("analytics event helpers", () => {
  it("normalizes public page view payloads without trusting extra fields", () => {
    const event = parseAnalyticsEventPayload({
      eventType: "page_view",
      path: "/portfolio/studio-frame",
      search: "?service=brand",
      referrer: "https://example.test/source",
      label: "ignored for views",
      metadata: {
        locale: "ru",
        nested: { unsafe: true },
        count: 3
      }
    });

    expect(event).toEqual({
      eventType: "page_view",
      href: "",
      label: "",
      metadata: {
        locale: "ru"
      },
      path: "/portfolio/studio-frame",
      referrer: "https://example.test/source",
      search: "?service=brand"
    });
  });

  it("removes claim tokens and unknown identifiers from analytics URLs", () => {
    const event = parseAnalyticsEventPayload({
      eventType: "cta_click",
      path: "/order/success",
      search: "?claim=secret-token&service=brand-identity&email=client@example.test",
      href: "/order/success?claim=secret-token&service=brand-identity",
      referrer: "https://example.test/order/success?claim=secret-token&sort=recent",
      label: "Continue"
    });

    expect(event).toMatchObject({
      search: "?service=brand-identity",
      href: "/order/success?service=brand-identity",
      referrer: "https://example.test/order/success?sort=recent"
    });
    expect(JSON.stringify(event)).not.toContain("secret-token");
    expect(JSON.stringify(event)).not.toContain("client@example.test");
  });

  it("normalizes CTA click payloads and rejects non-public paths", () => {
    expect(
      parseAnalyticsEventPayload({
        eventType: "cta_click",
        path: "/services",
        href: "https://example.test/order?service=brand",
        label: "Заказать"
      })
    ).toEqual({
      eventType: "cta_click",
      href: "/order?service=brand",
      label: "Заказать",
      metadata: {},
      path: "/services",
      referrer: "",
      search: ""
    });

    expect(parseAnalyticsEventPayload({ eventType: "page_view", path: "/admin" })).toBeNull();
    expect(parseAnalyticsEventPayload({ eventType: "page_view", path: "/account" })).toBeNull();
    expect(parseAnalyticsEventPayload({ eventType: "page_view", path: "/api/analytics" })).toBeNull();
  });

  it("builds insert payloads with a daily source hash and no raw request identifiers", () => {
    const sourceHash = createAnalyticsSourceHash({
      forwardedFor: "203.0.113.10, 198.51.100.2",
      now: new Date("2026-06-05T10:20:00.000Z"),
      realIp: "",
      userAgent: "Browser/1.0"
    });
    const sameDayHash = createAnalyticsSourceHash({
      forwardedFor: "203.0.113.10",
      now: new Date("2026-06-05T22:00:00.000Z"),
      realIp: "",
      userAgent: "Browser/1.0"
    });
    const nextDayHash = createAnalyticsSourceHash({
      forwardedFor: "203.0.113.10",
      now: new Date("2026-06-06T00:00:00.000Z"),
      realIp: "",
      userAgent: "Browser/1.0"
    });

    expect(sourceHash).toBe(sameDayHash);
    expect(sourceHash).not.toBe(nextDayHash);

    const payload = buildAnalyticsEventInsert(
      {
        eventType: "page_view",
        href: "",
        label: "",
        metadata: {},
        path: "/",
        referrer: "",
        search: ""
      },
      sourceHash
    );

    expect(payload).toEqual({
      event_type: "page_view",
      href: "",
      label: "",
      metadata: {},
      path: "/",
      referrer: "",
      search: "",
      source_hash: sourceHash
    });
    expect(JSON.stringify(payload)).not.toContain("203.0.113.10");
    expect(JSON.stringify(payload)).not.toContain("Browser/1.0");
  });
});
