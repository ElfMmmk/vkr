import { describe, expect, it } from "vitest";

import { getContentSecurityPolicy, getSecurityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("builds a CSP with baseline locked-down directives and configured Supabase origin", () => {
    const csp = getContentSecurityPolicy({
      nodeEnv: "production",
      supabaseUrl: "https://example.supabase.co"
    });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("connect-src 'self' https://example.supabase.co");
    expect(csp).toContain("img-src 'self' data: blob: https://images.unsplash.com https://example.supabase.co");
  });

  it("keeps HSTS production-only", () => {
    const developmentHeaders = getSecurityHeaders({ nodeEnv: "development" });
    const productionHeaders = getSecurityHeaders({ nodeEnv: "production" });

    expect(developmentHeaders.some((header) => header.key === "Strict-Transport-Security")).toBe(
      false
    );
    expect(productionHeaders).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload"
    });
  });

  it("preserves existing baseline security headers", () => {
    const headers = getSecurityHeaders({ nodeEnv: "test" });

    expect(headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      ])
    );
  });
});
