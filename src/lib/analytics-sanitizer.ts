const safeQueryKeys = new Set(["service", "sort", "tag"]);

function sanitizeSearchParams(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const safeParams = new URLSearchParams();

  for (const [key, value] of params) {
    if (safeQueryKeys.has(key) && value.trim()) {
      safeParams.append(key, value.trim());
    }
  }

  const serialized = safeParams.toString();

  return serialized ? `?${serialized}` : "";
}

export function sanitizeAnalyticsSearch(search: string): string {
  return sanitizeSearchParams(search.trim());
}

export function sanitizeAnalyticsHref(href: string): string {
  const cleanHref = href.trim();

  if (!cleanHref) {
    return "";
  }

  try {
    const url = new URL(cleanHref, "http://localhost");

    return `${url.pathname}${sanitizeSearchParams(url.search)}`;
  } catch {
    return "";
  }
}

export function sanitizeAnalyticsReferrer(referrer: string): string {
  const cleanReferrer = referrer.trim();

  if (!cleanReferrer) {
    return "";
  }

  try {
    const url = new URL(cleanReferrer);

    return `${url.origin}${url.pathname}${sanitizeSearchParams(url.search)}`;
  } catch {
    return "";
  }
}
