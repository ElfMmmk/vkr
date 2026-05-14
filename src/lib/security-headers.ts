export type SecurityHeader = {
  key: string;
  value: string;
};

type SecurityHeaderOptions = {
  supabaseUrl?: string | null;
  nodeEnv?: string;
};

function getOrigin(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getContentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const isProduction = nodeEnv === "production";
  const supabaseOrigin = getOrigin(options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const devConnectSources = isProduction
    ? []
    : ["http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*"];

  const directives = [
    ["default-src", "'self'"],
    ["base-uri", "'self'"],
    ["frame-ancestors", "'none'"],
    ["object-src", "'none'"],
    ["form-action", "'self'"],
    ["frame-src", "'none'"],
    ["img-src", ...unique(["'self'", "data:", "blob:", "https://images.unsplash.com", supabaseOrigin])],
    ["font-src", "'self'", "data:"],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["script-src", ...unique(["'self'", "'unsafe-inline'", isProduction ? null : "'unsafe-eval'"])],
    ["connect-src", ...unique(["'self'", supabaseOrigin, ...devConnectSources])],
    ["worker-src", "'self'", "blob:"]
  ];

  return directives.map((directive) => directive.join(" ")).join("; ");
}

export function getSecurityHeaders(options: SecurityHeaderOptions = {}): SecurityHeader[] {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const headers: SecurityHeader[] = [
    {
      key: "X-Content-Type-Options",
      value: "nosniff"
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin"
    },
    {
      key: "X-Frame-Options",
      value: "DENY"
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()"
    },
    {
      key: "Content-Security-Policy",
      value: getContentSecurityPolicy(options)
    }
  ];

  if (nodeEnv === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload"
    });
  }

  return headers;
}
