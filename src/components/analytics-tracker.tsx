"use client";

import { useEffect, useRef } from "react";

import { isPublicAnalyticsPath } from "@/lib/analytics-routes";

type AnalyticsPayload = {
  eventType: "page_view" | "cta_click";
  path: string;
  search?: string;
  referrer?: string;
  href?: string;
  label?: string;
  metadata?: Record<string, string>;
};

function sendAnalyticsEvent(payload: AnalyticsPayload): void {
  if (!isPublicAnalyticsPath(payload.path)) {
    return;
  }

  window
    .fetch("/api/analytics", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json"
      },
      keepalive: true,
      method: "POST"
    })
    .catch(() => {
      // Analytics must never interrupt navigation or CTA clicks.
    });
}

function getVisibleLabel(element: HTMLElement): string {
  return (
    element.dataset.analyticsLabel?.trim() ||
    element.textContent?.replace(/\s+/g, " ").trim() ||
    ""
  );
}

export function AnalyticsTracker() {
  const lastPageViewUrl = useRef<string>("");

  useEffect(() => {
    const sendPageView = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const url = `${path}${search}`;

      if (url === lastPageViewUrl.current || !isPublicAnalyticsPath(path)) {
        return;
      }

      lastPageViewUrl.current = url;
      sendAnalyticsEvent({
        eventType: "page_view",
        path,
        referrer: document.referrer,
        search,
        metadata: {
          locale: document.documentElement.lang || "ru"
        }
      });
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('a[data-analytics-cta="true"]');

      if (!link) {
        return;
      }

      sendAnalyticsEvent({
        eventType: "cta_click",
        href: link.getAttribute("href") || link.href,
        label: getVisibleLabel(link),
        path: window.location.pathname,
        referrer: document.referrer,
        search: window.location.search,
        metadata: {
          locale: document.documentElement.lang || "ru"
        }
      });
    };
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const notifyNavigation = () => window.dispatchEvent(new Event("analytics:navigation"));

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      notifyNavigation();

      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      notifyNavigation();

      return result;
    };

    sendPageView();
    document.addEventListener("click", handleClick, true);
    window.addEventListener("analytics:navigation", sendPageView);
    window.addEventListener("popstate", sendPageView);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("analytics:navigation", sendPageView);
      window.removeEventListener("popstate", sendPageView);
    };
  }, []);

  return null;
}
