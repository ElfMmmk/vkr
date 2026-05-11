"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearPreviewAdminSession, requireWritableAdmin } from "@/lib/auth";
import { formBoolean, formString, formStringArray, parseJsonObject } from "@/lib/form";
import { createSlug } from "@/lib/slug";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";
import {
  getPortfolioImageExtension,
  validatePortfolioImageBytes,
  validatePortfolioImageUpload
} from "@/lib/uploads";
import {
  pageSchema,
  pageKeySchema,
  projectSchema,
  requestStatusSchema,
  serviceSchema,
  tagSchema
} from "@/lib/validation";

export type UploadImageState = {
  ok: boolean;
  message: string;
};

export type AdminFormState = {
  ok: boolean;
  message: string;
};

function cleanId(value: string): string | null {
  return value.trim() || null;
}

function getMutationErrorMessage(error: unknown, fallback = "Mutation failed"): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return fallback;
}

function mutationError(error: unknown): never {
  const message = getMutationErrorMessage(error, "Unknown mutation error");
  throw new Error(message);
}

export async function signOutAction(): Promise<void> {
  await clearPreviewAdminSession();

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const client = await createSupabaseServerClient();

  if (client) {
    await client.auth.signOut();
  }

  redirect("/admin/login");
}

export async function saveServiceAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  let displayOrder = formString(formData, "displayOrder");

  if (!displayOrder && id) {
    const { data, error } = await client
      .from("services")
      .select("display_order")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      mutationError(error);
    }

    displayOrder = String(data?.display_order ?? 100);
  }

  if (!displayOrder) {
    const { data, error } = await client
      .from("services")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    if (error) {
      mutationError(error);
    }

    displayOrder = String(((data?.[0]?.display_order as number | undefined) ?? 90) + 10);
  }

  const parsed = serviceSchema.parse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug") || createSlug(formString(formData, "title")),
    description: formString(formData, "description"),
    details: formString(formData, "details"),
    displayOrder,
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
  await requireWritableAdmin();
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
  revalidatePath("/portfolio");
}

export async function reorderServicesAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const serviceIds = Array.from(new Set(formStringArray(formData, "serviceIds").map(cleanId)))
    .filter((serviceId): serviceId is string => Boolean(serviceId));

  if (!serviceIds.length) {
    return;
  }

  const updates = await Promise.all(
    serviceIds.map((serviceId, index) =>
      client
        .from("services")
        .update({ display_order: (index + 1) * 10 })
        .eq("id", serviceId)
    )
  );
  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    mutationError(failed.error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/portfolio");
}

export async function saveTagAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
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
  await requireWritableAdmin();
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
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const serviceIds = formStringArray(formData, "serviceIds");
  const tagIds = formStringArray(formData, "tagIds");
  const galleryImageIds = formStringArray(formData, "galleryImageIds")
    .map(cleanId)
    .filter((imageId): imageId is string => Boolean(imageId));
  const coverImageId = cleanId(formString(formData, "coverImageId"));
  const coverImageUrl = coverImageId ? "" : formString(formData, "coverImageUrl");
  let previousSlug: string | null = null;

  if (id) {
    const { data, error } = await client
      .from("projects")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      mutationError(error);
    }

    previousSlug = typeof data?.slug === "string" ? data.slug : null;
  }

  const parsed = projectSchema.parse({
    title: formString(formData, "title"),
    slug: formString(formData, "slug") || createSlug(formString(formData, "title")),
    shortDescription: formString(formData, "shortDescription"),
    fullDescription: formString(formData, "fullDescription"),
    coverImageUrl,
    isFeatured: formBoolean(formData, "isFeatured"),
    isPublished: formBoolean(formData, "isPublished")
  });

  if (parsed.isFeatured) {
    let featuredQuery = client
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true);

    if (id) {
      featuredQuery = featuredQuery.neq("id", id);
    }

    const { count, error } = await featuredQuery;

    if (error) {
      mutationError(error);
    }

    if ((count ?? 0) >= 6) {
      throw new Error("Можно закрепить не больше 6 проектов. Снимите закрепление с одного из текущих проектов.");
    }
  }

  const payload = {
    title: parsed.title,
    slug: createSlug(parsed.slug),
    short_description: parsed.shortDescription,
    full_description: parsed.fullDescription,
    cover_image_id: coverImageId,
    cover_image_url: parsed.coverImageUrl,
    is_featured: parsed.isFeatured,
    is_published: parsed.isPublished
  };

  const result = id
    ? await client.from("projects").update(payload).eq("id", id).select("id, slug").single()
    : await client.from("projects").insert(payload).select("id, slug").single();

  if (result.error || !result.data) {
    mutationError(result.error ?? new Error("Project was not saved"));
  }

  const projectId = result.data.id as string;

  const { error: deleteServicesError } = await client
    .from("project_services")
    .delete()
    .eq("project_id", projectId);
  const { error: deleteTagsError } = await client
    .from("project_tags")
    .delete()
    .eq("project_id", projectId);

  if (deleteServicesError || deleteTagsError) {
    mutationError(deleteServicesError ?? deleteTagsError);
  }

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

  const { error: deleteImagesError } = await client
    .from("project_images")
    .delete()
    .eq("project_id", projectId);

  if (deleteImagesError) {
    mutationError(deleteImagesError);
  }

  const imageIds = Array.from(new Set(galleryImageIds));

  if (imageIds.length > 0) {
    const { error } = await client.from("project_images").insert(
      imageIds.map((imageId, index) => ({
        project_id: projectId,
        image_id: imageId,
        sort_order: (index + 1) * 10
      }))
    );

    if (error) {
      mutationError(error);
    }
  }

  revalidatePath("/admin/projects");
  revalidatePath("/admin/images");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${result.data.slug}`);

  if (previousSlug && previousSlug !== result.data.slug) {
    revalidatePath(`/portfolio/${previousSlug}`);
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await client.from("projects").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/admin/images");
  revalidatePath("/portfolio");
}

async function savePageMutation(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const pageKey = pageKeySchema.parse(formString(formData, "pageKey"));
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

export async function savePageAction(formData: FormData): Promise<void> {
  await savePageMutation(formData);
}

export async function savePageStateAction(
  _previousState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    await savePageMutation(formData);

    return {
      ok: true,
      message: "Страница сохранена"
    };
  } catch (error) {
    return {
      ok: false,
      message: getMutationErrorMessage(error, "Не удалось сохранить страницу")
    };
  }
}

export async function updateRequestStatusAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
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
  await requireWritableAdmin();
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

export async function uploadImageAction(
  _previousState: UploadImageState,
  formData: FormData
): Promise<UploadImageState> {
  try {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "Выберите изображение"
    };
  }

  const uploadValidationError = validatePortfolioImageUpload(file);

  if (uploadValidationError) {
    return {
      ok: false,
      message: uploadValidationError
    };
  }

  const title = formString(formData, "title") || file.name.replace(/\.[^.]+$/, "");
  const caption = formString(formData, "caption");
  const sortOrder = Number(formString(formData, "sortOrder") || "100");
  const extension = getPortfolioImageExtension(file);
  const safeName = `${randomUUID()}.${extension}`;
  const storagePath = `uploads/${safeName}`;
  const bytes = await file.arrayBuffer();
  const bytesValidationError = validatePortfolioImageBytes(file, bytes);

  if (bytesValidationError) {
    return {
      ok: false,
      message: bytesValidationError
    };
  }

  const { error: uploadError } = await client.storage
    .from("portfolio-images")
    .upload(storagePath, bytes, {
      cacheControl: "31536000",
      contentType: file.type || "image/jpeg",
      upsert: false
    });

  if (uploadError) {
    return {
      ok: false,
      message: `Не удалось загрузить файл в bucket portfolio-images: ${getMutationErrorMessage(uploadError)}`
    };
  }

  const publicUrl = client.storage.from("portfolio-images").getPublicUrl(storagePath)
    .data.publicUrl;

  const { error } = await client.from("images").insert({
    storage_path: storagePath,
    public_url: publicUrl,
    title,
    parent_type: "free",
    parent_id: null,
    caption,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 100
  });

  if (error) {
    await client.storage.from("portfolio-images").remove([storagePath]);

    return {
      ok: false,
      message: `Файл загружен, но запись в медиатеке не сохранилась: ${getMutationErrorMessage(error)}`
    };
  }

  revalidatePath("/admin/images");
  revalidatePath("/admin/projects");
  revalidatePath("/portfolio");

  return {
    ok: true,
    message: "Изображение загружено"
  };
  } catch (error) {
    return {
      ok: false,
      message: `Не удалось загрузить изображение: ${getMutationErrorMessage(error)}`
    };
  }
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
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
