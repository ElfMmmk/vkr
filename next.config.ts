import type { NextConfig } from "next";

import { getSecurityHeaders } from "./src/lib/security-headers";

function getSupabaseImageHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseImageHostname = getSupabaseImageHostname();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb"
    }
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      ...(supabaseImageHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseImageHostname
            }
          ]
        : [])
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeaders({
          nodeEnv: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        })
      }
    ];
  }
};

export default nextConfig;
