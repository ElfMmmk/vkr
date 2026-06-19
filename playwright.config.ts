import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3000";
const e2eBaseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;
const useSupabaseE2E = process.env.PLAYWRIGHT_SUPABASE_E2E === "1";
const desktopOnly = process.env.PLAYWRIGHT_DESKTOP_ONLY === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  grepInvert: desktopOnly ? /mobile|tablet/ : undefined,
  use: {
    baseURL: e2eBaseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command: `npm run dev -- -p ${e2ePort}`,
    env: {
      ADMIN_EMAIL: useSupabaseE2E ? (process.env.ADMIN_EMAIL ?? "") : "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: useSupabaseE2E
        ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "")
        : "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: useSupabaseE2E
        ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "")
        : "",
      NEXT_PUBLIC_SUPABASE_URL: useSupabaseE2E
        ? (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
        : "",
      SUPABASE_SECRET_KEY: useSupabaseE2E ? (process.env.SUPABASE_SECRET_KEY ?? "") : "",
      SUPABASE_SERVICE_ROLE_KEY: useSupabaseE2E
        ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
        : ""
    },
    url: e2eBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 }
      }
    }
  ]
});
