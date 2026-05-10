"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { formBoolean, formString, formStringArray, parseJsonObject } from "@/lib/form";
import { createSlug } from "@/lib/slug";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";
import {
  pageSchema,
  projectSchema,
  requestStatusSchema,
  serviceSchema,
  tagSchema
} from "@/lib/validation";

function cleanId(value: string): string | null {
  return value.trim() || null;
}

function mutationError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Unknown mutation error";
  throw new Error(message);
}

export async function signOutAction(): Promise<void> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const client = await createSupabaseServerClient();

  if (client) {
    await client.auth.signOut();
  }

  redirect("/admin/login");
}

export async function saveServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const parsed = serviceSchema.parse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug") || createSlug(formString(formData, "title")),
    description: formString(formData, "description"),
    details: formString(formData, "details"),
    displayOrder: formString(formData, "displayOrder") || "100",
    isActive: formBoolean(formData, "isActive")
  });

  const payload = {
    title: parsed.title,
    slug: createSlug(parsed.slug),
    description: parsed.description,
    details: parsed.details,
    display_order: parsed.displayOrder,
    is_active: parsed.isActive
  };

  const result = id
    ? await client.from("services").update(payload).eq("id", id)
    : await client.from("services").insert(payload);

  if (result.error) {
    mutationError(result.error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/portfolio");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("services").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
}

export async function saveTagAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const parsed = tagSchema.parse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug") || createSlug(formString(formData, "title")),
    description: formString(formData, "description")
  });

  const payload = {
    title: parsed.title,
    slug: createSlug(parsed.slug),
    description: parsed.description
  };

  const result = id
    ? await client.from("tags").update(payload).eq("id", id)
    : await client.from("tags").insert(payload);

  if (result.error) {
    mutationError(result.error);
  }

  revalidatePath("/admin/tags");
  revalidatePath("/portfolio");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("tags").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/tags");
  revalidatePath("/portfolio");
}

export async function saveProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const serviceIds = formStringArray(formData, "serviceIds");
  const tagIds = formStringArray(formData, "tagIds");
  const parsed = projectSchema.parse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug") || createSlug(formString(formData, "title")),
    shortDescription: formString(formData, "shortDescription"),
    fullDescription: formString(formData, "fullDescription"),
    coverImageUrl: formString(formData, "coverImageUrl"),
    isPublished: formBoolean(formData, "isPublished")
  });

  const payload = {
    title: parsed.title,
    slug: createSlug(parsed.slug),
    short_description: parsed.shortDescription,
    full_description: parsed.fullDescription,
    cover_image_url: parsed.coverImageUrl,
    is_published: parsed.isPublished
  };

  const result = id
    ? await client.from("projects").update(payload).eq("id", id).select("id").single()
    : await client.from("projects").insert(payload).select("id").single();

  if (result.error || !result.data) {
    mutationError(result.error ?? new Error("Project was not saved"));
  }

  const projectId = result.data.id as string;

  await client.from("project_services").delete().eq("project_id", projectId);
  await client.from("project_tags").delete().eq("project_id", projectId);

  if (serviceIds.length > 0) {
    const { error } = await client.from("project_services").insert(
      serviceIds.map((serviceId) => ({
        project_id: projectId,
        service_id: serviceId
      }))
    );

    if (error) {
      mutationError(error);
    }
  }

  if (tagIds.length > 0) {
    const { error } = await client.from("project_tags").insert(
      tagIds.map((tagId) => ({
        project_id: projectId,
        tag_id: tagId
      }))
    );

    if (error) {
      mutationError(error);
    }
  }

  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("projects").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");
}

export async function savePageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client = getSupabaseAdminOrThrow();
  const pageKey = formString(formData, "pageKey");
  const rawBlocks = formString(formData, "blocks");
  const parsed = pageSchema.parse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
    blocks: rawBlocks
  });

  let blocks: Record<string, string>;

  try {
    blocks = parseJsonObject(parsed.blocks ?? "");
  } catch {
    throw new Error("Blocks must be a valid JSON object.");
  }

  const { error } = await client.from("pages").upsert(
    {
      page_key: pageKey,
      title: parsed.title,
      body: parsed.body,
      blocks
    },
    {
      onConflict: "page_key"
    }
  );

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/pages");
  revalidatePath("/");
  revalidatePath(`/${pageKey}`);
}

export async function updateRequestStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = cleanId(formString(formData, "id"));
  const status = requestStatusSchema.parse(formString(formData, "status"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow()
    .from("requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/requests");
}

export async function deleteRequestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("requests").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/requests");
}

export async function uploadImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client = getSupabaseAdminOrThrow();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image file.");
  }

  const parentType = formString(formData, "parentType") || "free";
  const parentId = cleanId(formString(formData, "parentId"));
  const caption = formString(formData, "caption");
  const sortOrder = Number(formString(formData, "sortOrder") || "100");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${createSlug(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
  const storagePath = `uploads/${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await client.storage
    .from("portfolio-images")
    .upload(storagePath, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: false
    });

  if (uploadError) {
    mutationError(uploadError);
  }

  const publicUrl = client.storage.from("portfolio-images").getPublicUrl(storagePath)
    .data.publicUrl;

  const { error } = await client.from("images").insert({
    storage_path: storagePath,
    public_url: publicUrl,
    parent_type: parentType,
    parent_id: parentId,
    caption,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 100
  });

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/images");
  revalidatePath("/portfolio");
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const storagePath = cleanId(formString(formData, "storagePath"));

  if (!id) {
    return;
  }

  const { error } = await client.from("images").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  if (storagePath) {
    await client.storage.from("portfolio-images").remove([storagePath]);
  }

  revalidatePath("/admin/images");
  revalidatePath("/portfolio");
}
