import { defineConfig, devices } from "@playwright/test";

const e2eBaseURL = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: e2eBaseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    env: {
      ADMIN_PREVIEW_EMAIL: "admin-preview@local.test",
      ADMIN_PREVIEW_MODE: "true",
      ADMIN_EMAIL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      SUPABASE_SECRET_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: ""
    },
    url: e2eBaseURL,
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
