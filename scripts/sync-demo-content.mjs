import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

class NoopRealtimeWebSocket {
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
  readyState = this.CLOSED;
  constructor(address) {
    this.url = String(address);
  }
  close() {}
  send() {
    throw new Error("Realtime transport is disabled for this sync script.");
  }
  addEventListener() {}
  removeEventListener() {}
}

async function loadEnv(path) {
  const content = await readFile(path, "utf8");
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^["']|["']$/g, "")];
      })
  );
}

function assertResult(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

async function upsertBy(client, table, match, payload) {
  const existing = assertResult(
    await client.from(table).select("id").match(match).maybeSingle(),
    `read ${table}`
  );
  const query = existing
    ? client.from(table).update(payload).eq("id", existing.id)
    : client.from(table).insert(payload);
  const saved = assertResult(await query.select("id").single(), `save ${table}`);
  return saved.id;
}

async function syncCatalog(client, catalog) {
  const serviceIds = new Map();

  for (const [serviceIndex, service] of catalog.services.entries()) {
    const serviceId = await upsertBy(client, "services", { slug: service.slug }, {
      title: service.title,
      slug: service.slug,
      description: service.description,
      details: service.details,
      display_order: (serviceIndex + 1) * 10,
      is_active: true
    });
    serviceIds.set(service.slug, serviceId);

    for (const [index, item] of service.packages.entries()) {
      await upsertBy(client, "service_packages", { service_id: serviceId, title: item.title }, {
        service_id: serviceId,
        title: item.title,
        description: item.description,
        badge: item.badge,
        best_for: item.bestFor,
        outcome: item.outcome,
        included_items: item.includedItems,
        price_from: item.priceFrom,
        price_to: item.priceTo,
        duration_from_days: item.durationFromDays,
        duration_to_days: item.durationToDays,
        display_order: (index + 1) * 10,
        is_active: true,
        is_recommended: Boolean(item.isRecommended)
      });
    }

    for (const [index, item] of service.addons.entries()) {
      await upsertBy(client, "service_addons", { service_id: serviceId, title: item.title }, {
        service_id: serviceId,
        title: item.title,
        description: item.description,
        price: item.price,
        duration_days: item.durationDays,
        display_order: (index + 1) * 10,
        is_active: true
      });
    }

    const packageTitles = service.packages.map((item) => item.title);
    const addonTitles = service.addons.map((item) => item.title);
    assertResult(
      await client
        .from("service_packages")
        .delete()
        .eq("service_id", serviceId)
        .not("title", "in", `(${packageTitles.map((title) => `"${title.replaceAll('"', '\\"')}"`).join(",")})`),
      "remove obsolete service packages"
    );
    assertResult(
      await client
        .from("service_addons")
        .delete()
        .eq("service_id", serviceId)
        .not("title", "in", `(${addonTitles.map((title) => `"${title.replaceAll('"', '\\"')}"`).join(",")})`),
      "remove obsolete service add-ons"
    );
  }

  const tagDefinitions = {
    branding: ["Брендинг", "Проекты с визуальной системой бренда"],
    digital: ["Digital", "Материалы для онлайн-коммуникации"],
    print: ["Печать", "Печатные и упаковочные носители"],
    minimal: ["Минимализм", "Сдержанная визуальная подача"]
  };
  const tagIds = new Map();
  for (const [slug, [title, description]] of Object.entries(tagDefinitions)) {
    tagIds.set(slug, await upsertBy(client, "tags", { slug }, { slug, title, description }));
  }

  for (const [projectIndex, project] of catalog.projects.entries()) {
    const projectId = await upsertBy(client, "projects", { slug: project.slug }, {
      title: project.title,
      slug: project.slug,
      short_description: project.shortDescription,
      full_description: project.fullDescription,
      cover_image_url: `/assets/demo-projects/${project.cover}`,
      display_order: (projectIndex + 1) * 10,
      is_featured: project.featured,
      is_published: true
    });

    assertResult(await client.from("project_services").delete().eq("project_id", projectId), "clear project services");
    assertResult(await client.from("project_tags").delete().eq("project_id", projectId), "clear project tags");
    assertResult(await client.from("project_images").delete().eq("project_id", projectId), "clear project images");

    const projectServices = project.serviceSlugs.map((slug) => ({
      project_id: projectId,
      service_id: serviceIds.get(slug)
    })).filter((row) => row.service_id);
    if (projectServices.length) {
      assertResult(await client.from("project_services").insert(projectServices), "save project services");
    }

    const projectTags = project.tagSlugs.map((slug) => ({
      project_id: projectId,
      tag_id: tagIds.get(slug)
    })).filter((row) => row.tag_id);
    if (projectTags.length) {
      assertResult(await client.from("project_tags").insert(projectTags), "save project tags");
    }

    const files = Array.from(new Set([project.cover, ...project.gallery]));
    const imageIds = new Map();
    for (const [imageIndex, fileName] of files.entries()) {
      const storagePath = `demo-projects/${fileName}`;
      const imageId = await upsertBy(client, "images", { parent_id: projectId, storage_path: storagePath }, {
        storage_path: storagePath,
        public_url: `/assets/demo-projects/${fileName}`,
        title: project.title,
        caption: `Материал проекта ${project.title}`,
        parent_type: "project",
        parent_id: projectId,
        sort_order: (imageIndex + 1) * 10
      });
      imageIds.set(fileName, imageId);
    }

    assertResult(
      await client.from("projects").update({ cover_image_id: imageIds.get(project.cover) }).eq("id", projectId),
      "save project cover"
    );
    if (project.gallery.length) {
      assertResult(await client.from("project_images").insert(project.gallery.map((fileName, index) => ({
        project_id: projectId,
        image_id: imageIds.get(fileName),
        sort_order: (index + 1) * 10
      }))), "save project gallery");
    }
  }
}

async function syncProfilesAndCleanup(client) {
  for (const [email, fullName] of [
    ["formaxmos@gmail.com", "Степан"],
    ["vkr-manager-test@example.com", "Игорь"],
    ["vkr-client-test@example.com", "Мария"]
  ]) {
    assertResult(await client.from("profiles").update({ full_name: fullName }).eq("email", email), `update ${email}`);
  }

  const targetEmail = "formaxmos@mail.ru";
  const users = assertResult(await client.auth.admin.listUsers({ page: 1, perPage: 1000 }), "list auth users").users;
  const target = users.find((user) => user.email?.toLowerCase() === targetEmail);
  if (!target) {
    return;
  }

  const linkedRequestsResult = await client
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("client_user_id", target.id);
  if (linkedRequestsResult.error) {
    throw new Error(`check linked requests: ${linkedRequestsResult.error.message}`);
  }
  if ((linkedRequestsResult.count ?? 0) > 0) {
    throw new Error(`Refusing to delete ${targetEmail}: linked requests exist`);
  }

  assertResult(await client.auth.admin.deleteUser(target.id), `delete ${targetEmail}`);
}

async function verifySync(client, catalog) {
  const services = assertResult(
    await client.from("services").select("slug, service_packages(id), service_addons(id)").in(
      "slug",
      catalog.services.map((service) => service.slug)
    ),
    "verify services"
  );
  const projects = assertResult(
    await client.from("projects").select("slug").in(
      "slug",
      catalog.projects.map((project) => project.slug)
    ),
    "verify projects"
  );
  const profiles = assertResult(
    await client.from("profiles").select("email, full_name").in("email", [
      "formaxmos@gmail.com",
      "vkr-manager-test@example.com",
      "vkr-client-test@example.com"
    ]),
    "verify profiles"
  );

  if (
    services.length !== 5
    || projects.length !== 10
    || services.some((service) => service.service_packages.length !== 3 || service.service_addons.length !== 2)
  ) {
    throw new Error("Live catalog verification failed");
  }

  const expectedNames = new Map([
    ["formaxmos@gmail.com", "Степан"],
    ["vkr-manager-test@example.com", "Игорь"],
    ["vkr-client-test@example.com", "Мария"]
  ]);
  if (profiles.some((profile) => expectedNames.get(profile.email) !== profile.full_name)) {
    throw new Error("Live profile verification failed");
  }
}

const root = resolve(import.meta.dirname, "..");
const env = { ...(await loadEnv(resolve(root, ".env.local"))), ...process.env };
const catalog = JSON.parse(await readFile(resolve(root, "src/lib/demo-catalog.json"), "utf8"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required");
}

const client = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: NoopRealtimeWebSocket }
});

await syncCatalog(client, catalog);
await syncProfilesAndCleanup(client);
await verifySync(client, catalog);
process.stdout.write(`Synced ${catalog.services.length} services and ${catalog.projects.length} projects.\n`);
