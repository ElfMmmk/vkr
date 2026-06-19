import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("complete public localization wiring", () => {
  it("reads the locale on every public route that renders static copy", () => {
    const routes = [
      "src/app/about/page.tsx",
      "src/app/contacts/page.tsx",
      "src/app/privacy/page.tsx",
      "src/app/order/success/page.tsx",
      "src/app/account/login/page.tsx",
      "src/app/account/register/page.tsx",
      "src/app/account/page.tsx",
      "src/app/account/requests/[id]/page.tsx",
      "src/app/not-found.tsx"
    ];

    for (const route of routes) {
      expect(readSource(route)).toContain("getLocale");
    }
  });

  it("passes locale into public client components with user-facing labels", () => {
    expect(readSource("src/components/site-footer.tsx")).toContain("getLocale");
    expect(readSource("src/components/order-form.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/account-auth-form.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/project-card.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/project-gallery-slider.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/portfolio-sort-select.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/featured-project-rotator.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/status-badge.tsx")).toContain("locale?: Locale");
    expect(readSource("src/components/order-estimate-breakdown.tsx")).toContain("locale?: Locale");
    expect(readSource("src/components/contract-feedback-thread.tsx")).toContain("locale?: Locale");
    expect(readSource("src/components/order-revision-modal.tsx")).toContain("locale: Locale");
    expect(readSource("src/components/route-flash-toast.tsx")).toContain("locale?: Locale");
  });

  it("submits locale with account and order forms so server errors stay in one language", () => {
    expect(readSource("src/components/account-auth-form.tsx")).toContain('name="locale"');
    expect(readSource("src/components/order-form.tsx")).toContain('name="locale"');
    expect(readSource("src/app/account/actions.ts")).toContain("accountActionMessages");
    expect(readSource("src/app/order/actions.ts")).toContain("orderActionMessages");
  });

  it("localizes authenticated account data and timeline without translating user text", () => {
    expect(readSource("src/lib/data/client.ts")).toContain("localizeOrderRequestContent");
    expect(readSource("src/lib/data/client.ts")).toContain("locale: Locale");
    expect(readSource("src/lib/request-timeline.ts")).toContain("locale: Locale");
    expect(readSource("src/app/account/page.tsx")).toContain("listClientRequests(session.id, locale)");
    expect(readSource("src/app/account/requests/[id]/page.tsx")).toContain(
      "getClientRequestById(session.id, id, locale)"
    );
  });
});
