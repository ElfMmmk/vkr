import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSql = readFileSync(join(process.cwd(), "supabase", "schema.sql"), "utf8");
const seedSql = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");

describe("supabase security schema", () => {
  it("keeps order inserts server-only for public Supabase clients", () => {
    expect(schemaSql).toContain('drop policy if exists "Anon can submit requests"');
    expect(schemaSql).toContain('drop policy if exists "Authenticated clients can submit own requests"');
    expect(schemaSql).toContain("revoke insert on public.requests from anon, authenticated;");
    expect(schemaSql).not.toContain('create policy "Anon can submit requests"');
    expect(schemaSql).not.toContain('create policy "Authenticated clients can submit own requests"');
    expect(schemaSql).not.toContain("grant insert on public.requests to anon, authenticated;");
    expect(schemaSql).not.toContain("grant select, insert on public.requests to authenticated;");
    expect(schemaSql).not.toContain("for insert with check (status = 'new');");
  });

  it("limits profile updates to the public full_name field", () => {
    expect(schemaSql).toContain("grant select on public.profiles to authenticated;");
    expect(schemaSql).toContain("grant update (full_name) on public.profiles to authenticated;");
    expect(schemaSql).not.toContain("grant select, update on public.profiles to authenticated;");
  });

  it("keeps the portfolio image bucket reproducible in sql", () => {
    expect(schemaSql).toContain("insert into storage.buckets");
    expect(schemaSql).toContain("'portfolio-images'");
    expect(schemaSql).toContain("10485760");
    expect(schemaSql).toContain("'image/png'");
    expect(schemaSql).toContain("'image/jpeg'");
  });

  it("keeps technical audit hardening in the base schema", () => {
    expect(schemaSql).toContain("revoke insert on public.requests from anon, authenticated;");
    expect(schemaSql).toContain("insert into storage.buckets");
    expect(schemaSql).toContain("grant update (full_name) on public.profiles to authenticated;");
  });

  it("adds order pricing tables with explicit grants and RLS", () => {
    expect(schemaSql).toContain("create table if not exists public.service_packages");
    expect(schemaSql).toContain("create table if not exists public.service_addons");
    expect(schemaSql).toContain("create table if not exists public.order_contracts");
    expect(schemaSql).toContain("alter table public.service_packages enable row level security;");
    expect(schemaSql).toContain("alter table public.service_addons enable row level security;");
    expect(schemaSql).toContain("alter table public.order_contracts enable row level security;");
    expect(schemaSql).toContain("grant select on public.service_packages to anon, authenticated;");
    expect(schemaSql).toContain("grant select on public.service_addons to anon, authenticated;");
    expect(schemaSql).toContain("grant select on public.order_contracts to authenticated;");
    expect(schemaSql).toContain("grant all privileges on public.order_contracts to service_role;");
  });

  it("adds private analytics events for server-side traffic tracking", () => {
    expect(schemaSql).toContain("create table if not exists public.analytics_events");
    expect(schemaSql).toContain("event_type text not null check (event_type in ('page_view', 'cta_click'))");
    expect(schemaSql).toContain("analytics_events_type_created_idx");
    expect(schemaSql).toContain("analytics_events_source_created_idx");
    expect(schemaSql).toContain("alter table public.analytics_events enable row level security;");
    expect(schemaSql).toContain("revoke all on public.analytics_events from anon, authenticated;");
    expect(schemaSql).toContain("grant all privileges on public.analytics_events to service_role;");
  });

  it("adds request order columns before indexes reference them", () => {
    const addPackageColumnIndex = schemaSql.indexOf("add column if not exists package_id");
    const packageIndexIndex = schemaSql.indexOf("requests_package_created_idx");
    const addReferenceColumnIndex = schemaSql.indexOf("add column if not exists reference_project_id");
    const referenceIndexIndex = schemaSql.indexOf("requests_reference_project_idx");

    expect(addPackageColumnIndex).toBeGreaterThan(-1);
    expect(packageIndexIndex).toBeGreaterThan(-1);
    expect(addPackageColumnIndex).toBeLessThan(packageIndexIndex);
    expect(addReferenceColumnIndex).toBeGreaterThan(-1);
    expect(referenceIndexIndex).toBeGreaterThan(-1);
    expect(addReferenceColumnIndex).toBeLessThan(referenceIndexIndex);
  });

  it("keeps clients limited to their own visible contract orders", () => {
    expect(schemaSql).toContain('create policy "Clients can read own order contracts"');
    expect(schemaSql).toContain("status in ('sent', 'accepted')");
    expect(schemaSql).toContain("request.client_user_id = auth.uid()");
  });

  it("seeds package and add-on prices after demo services are created", () => {
    expect(seedSql).toContain("with package_seed");
    expect(seedSql).toContain("public.service_packages");
    expect(seedSql).toContain("'brand-identity', 'Старт'");
    expect(seedSql).toContain("'presentation-design', 'До 20 слайдов'");
    expect(seedSql).toContain("with addon_seed");
    expect(seedSql).toContain("public.service_addons");
    expect(seedSql).toContain("'packaging-print', 'Допечатная проверка'");
    expect(seedSql).toContain("where not exists");
  });
});
