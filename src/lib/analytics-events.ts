import { createHash } from "node:crypto";

import { isPublicAnalyticsPath } from "@/lib/analytics-routes";
import {
  sanitizeAnalyticsHref,
  sanitizeAnalyticsReferrer,
  sanitizeAnalyticsSearch
} from "@/lib/analytics-sanitizer";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { AnalyticsEventType } from "@/lib/types";

export type ParsedAnalyticsEvent = {
  eventType: AnalyticsEventType;
  path: string;
  search: string;
  referrer: string;
  href: string;
  label: string;
  metadata: Record<string, string>;
};

const analyticsEventTypes = new Set<AnalyticsEventType>(["page_view", "cta_click"]);
const maxPathLength = 240;
const maxSearchLength = 500;
const maxReferrerLength = 500;
const maxHrefLength = 500;
const maxLabelLength = 160;
const maxMetadataEntries = 8;
const maxMetadataKeyLength = 40;
const maxMetadataValueLength = 120;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizePath(value: unknown): string | null {
  const rawPath = cleanText(value, maxPathLength);

  if (!rawPath) {
    return null;
  }

  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  return isPublicAnalyticsPath(path) ? path : null;
}

function normalizeHref(value: unknown): string {
  const rawHref = cleanText(value, maxHrefLength);

  return sanitizeAnalyticsHref(rawHref).slice(0, maxHrefLength);
}

function normalizeMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => {
        const [key, entryValue] = entry;

        return Boolean(key.trim()) && typeof entryValue === "string" && Boolean(entryValue.trim());
      })
      .slice(0, maxMetadataEntries)
      .map(([key, entryValue]) => [
        key.trim().slice(0, maxMetadataKeyLength),
        entryValue.trim().slice(0, maxMetadataValueLength)
      ])
  );
}

export function parseAnalyticsEventPayload(payload: unknown): ParsedAnalyticsEvent | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const eventType = record.eventType;

  if (!analyticsEventTypes.has(eventType as AnalyticsEventType)) {
    return null;
  }

  const path = normalizePath(record.path);

  if (!path) {
    return null;
  }

  const type = eventType as AnalyticsEventType;

  return {
    eventType: type,
    path,
    search: sanitizeAnalyticsSearch(cleanText(record.search, maxSearchLength)).slice(0, maxSearchLength),
    referrer: sanitizeAnalyticsReferrer(cleanText(record.referrer, maxReferrerLength)).slice(
      0,
      maxReferrerLength
    ),
    href: type === "cta_click" ? normalizeHref(record.href) : "",
    label: type === "cta_click" ? cleanText(record.label, maxLabelLength) : "",
    metadata: normalizeMetadata(record.metadata)
  };
}

export function createAnalyticsSourceHash({
  forwardedFor,
  now = new Date(),
  realIp,
  userAgent
}: {
  forwardedFor: string;
  now?: Date;
  realIp: string;
  userAgent: string;
}): string {
  const ip = forwardedFor.split(",")[0]?.trim() || realIp.trim();
  const dayBucket = now.toISOString().slice(0, 10);

  return createHash("sha256").update(`${ip}|${userAgent.trim()}|${dayBucket}`).digest("hex");
}

export function buildAnalyticsEventInsert(
  event: ParsedAnalyticsEvent,
  sourceHash: string
): TablesInsert<"analytics_events"> {
  return {
    event_type: event.eventType,
    href: event.href,
    label: event.label,
    metadata: event.metadata,
    path: event.path,
    referrer: event.referrer,
    search: event.search,
    source_hash: sourceHash
  };
}
