"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireRequestManager,
  requireRoleAdmin,
  requireWritableAdmin
} from "@/lib/auth";
import { fieldLimits } from "@/lib/field-limits";
import { formBoolean, formString, formStringArray, parseJsonObject } from "@/lib/form";
import { deleteOrderAttachmentFile } from "@/lib/order-attachment-storage";
import { formatRequestStatusChangeBody } from "@/lib/request-status";
import { createSlug } from "@/lib/slug";
import { parsePackageIncludedItems } from "@/lib/service-package-marketing";
import { getSupabaseAdminOrThrow } from "@/lib/supabase/server";
import {
  getPortfolioImageExtension,
  validatePortfolioImageBytes,
  validatePortfolioImageUpload
} from "@/lib/uploads";
import {
  imageUploadSchema,
  pageSchema,
  pageKeySchema,
  projectSchema,
  orderContractSchema,
  requestStatusSchema,
  serviceAddonSchema,
  servicePackageSchema,
  serviceSchema,
  tagSchema
} from "@/lib/validation";
import type { UserRole } from "@/lib/types";

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

function logAdminActionError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>
) {
  console.error("[admin-action]", context, {
    error: getMutationErrorMessage(error, "Unknown error"),
    meta
  });
}

function parseUserRole(value: string): UserRole {
  if (value === "admin" || value === "manager" || value === "client") {
    return value;
  }

  throw new Error("Unknown user role.");
}

function getAdminRedirectTo(formData: FormData, fallback: string): string {
  const redirectTo = formString(formData, "redirectTo");

  return redirectTo === "/admin" || redirectTo.startsWith("/admin/") ? redirectTo : fallback;
}

function redirectWithNotice(path: string, notice: string): never {
  const url = new URL(path, "http://localhost");

  if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) {
    redirect(`/admin?notice=${notice}`);
  }

  url.searchParams.set("notice", notice);
  redirect(`${url.pathname}${url.search}${url.hash}`);
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
  redirectWithNotice("/admin/services", "service-saved");
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
  redirectWithNotice("/admin/services", "service-deleted");
}

export async function saveServicePackageAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const serviceId = cleanId(formString(formData, "serviceId")) ?? "";
  let displayOrder = formString(formData, "displayOrder");

  if (!displayOrder) {
    const { data: lastItem } = await client
      .from("service_packages")
      .select("display_order")
      .eq("service_id", serviceId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    displayOrder = String((lastItem?.display_order ?? 0) + 10);
  }

  const parsed = servicePackageSchema.parse({
    serviceId,
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    badge: formString(formData, "badge"),
    bestFor: formString(formData, "bestFor"),
    outcome: formString(formData, "outcome"),
    includedItems: parsePackageIncludedItems(formString(formData, "includedItems")),
    priceFrom: formString(formData, "priceFrom"),
    priceTo: formString(formData, "priceTo"),
    durationFromDays: formString(formData, "durationFromDays"),
    durationToDays: formString(formData, "durationToDays"),
    displayOrder,
    isActive: formBoolean(formData, "isActive"),
    isRecommended: formBoolean(formData, "isRecommended")
  });
  const payload = {
    service_id: parsed.serviceId,
    title: parsed.title,
    description: parsed.description,
    badge: parsed.badge,
    best_for: parsed.bestFor,
    outcome: parsed.outcome,
    included_items: parsed.includedItems,
    price_from: parsed.priceFrom,
    price_to: parsed.priceTo,
    duration_from_days: parsed.durationFromDays,
    duration_to_days: parsed.durationToDays,
    display_order: parsed.displayOrder,
    is_active: parsed.isActive,
    is_recommended: parsed.isRecommended
  };
  const result = id
    ? await client.from("service_packages").update(payload).eq("id", id)
    : await client.from("service_packages").insert(payload);

  if (result.error) {
    mutationError(result.error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/order");
  redirectWithNotice("/admin/services", "service-package-saved");
}

export async function deleteServicePackageAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("service_packages").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/order");
  redirectWithNotice("/admin/services", "service-package-deleted");
}

export async function saveServiceAddonAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const serviceId = cleanId(formString(formData, "serviceId")) ?? "";
  let displayOrder = formString(formData, "displayOrder");

  if (!displayOrder) {
    const { data: lastItem } = await client
      .from("service_addons")
      .select("display_order")
      .eq("service_id", serviceId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    displayOrder = String((lastItem?.display_order ?? 0) + 10);
  }

  const parsed = serviceAddonSchema.parse({
    serviceId,
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    price: formString(formData, "price"),
    durationDays: formString(formData, "durationDays"),
    displayOrder,
    isActive: formBoolean(formData, "isActive")
  });
  const payload = {
    service_id: parsed.serviceId,
    title: parsed.title,
    description: parsed.description,
    price: parsed.price,
    duration_days: parsed.durationDays,
    display_order: parsed.displayOrder,
    is_active: parsed.isActive
  };
  const result = id
    ? await client.from("service_addons").update(payload).eq("id", id)
    : await client.from("service_addons").insert(payload);

  if (result.error) {
    mutationError(result.error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/order");
  redirectWithNotice("/admin/services", "service-addon-saved");
}

export async function deleteServiceAddonAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("service_addons").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/order");
  redirectWithNotice("/admin/services", "service-addon-deleted");
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
  redirectWithNotice("/admin/services", "services-reordered");
}

export async function reorderServicePackagesAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const serviceId = cleanId(formString(formData, "serviceId"));
  const itemIds = Array.from(new Set(formStringArray(formData, "itemIds").map(cleanId)))
    .filter((itemId): itemId is string => Boolean(itemId));

  if (!serviceId || !itemIds.length) {
    return;
  }

  const updates = await Promise.all(
    itemIds.map((itemId, index) =>
      client
        .from("service_packages")
        .update({ display_order: (index + 1) * 10 })
        .eq("id", itemId)
        .eq("service_id", serviceId)
    )
  );
  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    mutationError(failed.error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/order");
  redirectWithNotice("/admin/services", "service-packages-reordered");
}

export async function reorderServiceAddonsAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const serviceId = cleanId(formString(formData, "serviceId"));
  const itemIds = Array.from(new Set(formStringArray(formData, "itemIds").map(cleanId)))
    .filter((itemId): itemId is string => Boolean(itemId));

  if (!serviceId || !itemIds.length) {
    return;
  }

  const updates = await Promise.all(
    itemIds.map((itemId, index) =>
      client
        .from("service_addons")
        .update({ display_order: (index + 1) * 10 })
        .eq("id", itemId)
        .eq("service_id", serviceId)
    )
  );
  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    mutationError(failed.error);
  }

  revalidatePath("/admin/services");
  revalidatePath("/order");
  redirectWithNotice("/admin/services", "service-addons-reordered");
}

export async function reorderProjectsAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const projectIds = Array.from(new Set(formStringArray(formData, "projectIds").map(cleanId)))
    .filter((projectId): projectId is string => Boolean(projectId));

  if (!projectIds.length) {
    return;
  }

  const updates = await Promise.all(
    projectIds.map((projectId, index) =>
      client
        .from("projects")
        .update({ display_order: (index + 1) * 10 })
        .eq("id", projectId)
    )
  );
  const failed = updates.find((result) => result.error);

  if (failed?.error) {
    mutationError(failed.error);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/");
  revalidatePath("/portfolio");
  redirectWithNotice("/admin/projects", "projects-reordered");
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
  redirectWithNotice("/admin/tags", "tag-saved");
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
  redirectWithNotice("/admin/tags", "tag-deleted");
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
  let displayOrder: number | null = null;
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
  } else {
    const { data, error } = await client
      .from("projects")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    if (error && !getMutationErrorMessage(error).includes("display_order")) {
      mutationError(error);
    }

    displayOrder = error ? null : (((data?.[0]?.display_order as number | undefined) ?? 90) + 10);
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
    is_published: parsed.isPublished,
    ...(displayOrder === null ? {} : { display_order: displayOrder })
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

  redirectWithNotice("/admin/projects", "project-saved");
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
  redirectWithNotice("/admin/projects", "project-deleted");
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
  } catch {
    return {
      ok: false,
      message: "Не удалось сохранить страницу. Проверьте поля и попробуйте ещё раз."
    };
  }
}

export async function updateRequestStatusAction(formData: FormData): Promise<void> {
  const admin = await requireRequestManager();
  const id = cleanId(formString(formData, "id"));
  const status = requestStatusSchema.parse(formString(formData, "status"));
  const redirectTo = getAdminRedirectTo(formData, "/admin/requests");

  if (!id) {
    return;
  }

  const client = getSupabaseAdminOrThrow();
  const { data: currentRequest } = await client
    .from("requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await client
    .from("requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    mutationError(error);
  }

  await client.from("request_status_history").insert({
    request_id: id,
    from_status: typeof currentRequest?.status === "string" ? currentRequest.status : null,
    to_status: status,
    changed_by_user_id: admin.id,
    changed_by_role: admin.role
  });

  await client.from("notifications").insert({
    type: "request_status_changed",
    title: "Статус заявки изменён",
    body: formatRequestStatusChangeBody(status),
    entity_type: "request",
    entity_id: id,
    audience_role: "manager"
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/analytics");
  redirectWithNotice(redirectTo, "request-status-updated");
}

export async function saveOrderContractAction(formData: FormData): Promise<void> {
  await requireRequestManager();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));
  const parsed = orderContractSchema.parse({
    requestId: cleanId(formString(formData, "requestId")) ?? "",
    finalPrice: formString(formData, "finalPrice"),
    finalDurationDays: formString(formData, "finalDurationDays"),
    workScope: formString(formData, "workScope"),
    materials: formString(formData, "materials"),
    managerComment: formString(formData, "managerComment"),
    status: formString(formData, "status")
  });

  let previousStatus: string | null = null;

  if (id) {
    const { data: existingContract, error: existingContractError } = await client
      .from("order_contracts")
      .select("request_id, status")
      .eq("id", id)
      .maybeSingle();

    if (existingContractError) {
      mutationError(existingContractError);
    }

    if (existingContract?.status === "accepted") {
      redirectWithNotice(
        `/admin/requests/${existingContract.request_id ?? parsed.requestId}`,
        "order-contract-locked"
      );
    }

    previousStatus = existingContract?.status ?? null;
  }

  const payload = {
    request_id: parsed.requestId,
    final_price: parsed.finalPrice,
    final_duration_days: parsed.finalDurationDays,
    work_scope: parsed.workScope,
    materials: parsed.materials,
    manager_comment: parsed.managerComment,
    status: parsed.status === "accepted" ? "sent" : parsed.status,
    accepted_at: null
  };
  const result = id
    ? await client.from("order_contracts").update(payload).eq("id", id)
    : await client.from("order_contracts").upsert(payload, { onConflict: "request_id" });

  if (result.error) {
    mutationError(result.error);
  }

  if (previousStatus === "revision_requested" && parsed.status === "sent") {
    await client.from("notifications").insert({
      type: "system",
      title: "Заказ отправлен повторно",
      body: "Исправленные условия отправлены клиенту на повторное согласование.",
      entity_type: "request",
      entity_id: parsed.requestId,
      audience_role: "manager"
    });
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${parsed.requestId}`);
  revalidatePath("/account");
  redirectWithNotice(`/admin/requests/${parsed.requestId}`, "order-contract-saved");
}

export async function saveOrderContractFeedbackAction(formData: FormData): Promise<void> {
  const admin = await requireRequestManager();
  const contractId = cleanId(formString(formData, "contractId"));
  const requestId = cleanId(formString(formData, "requestId"));
  const message = formString(formData, "message").trim();

  if (!contractId || !requestId || message.length < 10 || message.length > 1000) {
    redirectWithNotice(
      requestId ? `/admin/requests/${requestId}` : "/admin/requests",
      "order-comment-invalid"
    );
  }

  const client = getSupabaseAdminOrThrow();
  const { data: contract, error: contractError } = await client
    .from("order_contracts")
    .select("id, request_id")
    .eq("id", contractId)
    .eq("request_id", requestId)
    .maybeSingle();

  if (contractError || !contract) {
    redirectWithNotice(`/admin/requests/${requestId}`, "order-comment-failed");
  }

  const { error } = await client.from("order_contract_feedback").insert({
    contract_id: contractId,
    request_id: requestId,
    client_user_id: null,
    author_role: admin.role === "admin" ? "admin" : "manager",
    message
  });

  if (error) {
    redirectWithNotice(`/admin/requests/${requestId}`, "order-comment-failed");
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/account/requests/${requestId}`);
  redirectWithNotice(`/admin/requests/${requestId}`, "order-comment-saved");
}

export async function deleteOrderAttachmentAction(formData: FormData): Promise<void> {
  const admin = await requireRequestManager();
  const attachmentId = cleanId(formString(formData, "attachmentId"));
  const requestId = cleanId(formString(formData, "requestId"));

  if (!attachmentId || !requestId) {
    return;
  }

  const result = await deleteOrderAttachmentFile(getSupabaseAdminOrThrow(), {
    actorUserId: admin.id,
    attachmentId,
    canDeleteAny: true,
    requestId
  });

  if (!result.ok) {
    redirectWithNotice(`/admin/requests/${requestId}`, "attachment-delete-failed");
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/account/requests/${requestId}`);
  redirectWithNotice(`/admin/requests/${requestId}`, "attachment-deleted");
}

export async function deleteRequestAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const id = cleanId(formString(formData, "id"));
  const redirectTo = getAdminRedirectTo(formData, "/admin/requests");

  if (!id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow().from("requests").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/requests");
  redirectWithNotice(redirectTo, "request-deleted");
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

    const parsed = imageUploadSchema.safeParse({
      title: formString(formData, "title"),
      caption: formString(formData, "caption"),
      sortOrder: formString(formData, "sortOrder") || "100"
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Проверьте поля изображения"
      };
    }

    const title =
      parsed.data.title || file.name.replace(/\.[^.]+$/, "").slice(0, fieldLimits.image.title.max);
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
      logAdminActionError("image storage upload failed", uploadError, {
        contentType: file.type,
        size: file.size
      });

      return {
        ok: false,
        message:
          "Не удалось загрузить файл в медиатеку. Проверьте настройки хранилища и попробуйте позже."
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
      caption: parsed.data.caption,
      sort_order: parsed.data.sortOrder
    });

    if (error) {
      logAdminActionError("image metadata insert failed", error, {
        storagePath,
        contentType: file.type,
        size: file.size
      });

      const { error: cleanupError } = await client.storage.from("portfolio-images").remove([storagePath]);

      if (cleanupError) {
        logAdminActionError("image storage cleanup failed", cleanupError, { storagePath });
      }

      return {
        ok: false,
        message: "Не удалось сохранить изображение в медиатеке. Попробуйте ещё раз."
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
    logAdminActionError("image upload action failed", error);

    return {
      ok: false,
      message: "Не удалось загрузить изображение. Попробуйте позже."
    };
  }
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  await requireWritableAdmin();
  const client = getSupabaseAdminOrThrow();
  const id = cleanId(formString(formData, "id"));

  if (!id) {
    return;
  }

  const { data: image, error: imageError } = await client
    .from("images")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (imageError) {
    mutationError(imageError);
  }

  const { error } = await client.from("images").delete().eq("id", id);

  if (error) {
    mutationError(error);
  }

  const storagePath = typeof image?.storage_path === "string" ? image.storage_path : null;

  if (storagePath) {
    await client.storage.from("portfolio-images").remove([storagePath]);
  }

  revalidatePath("/admin/images");
  revalidatePath("/portfolio");
  redirectWithNotice("/admin/images", "image-deleted");
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const admin = await requireRequestManager();
  const id = cleanId(formString(formData, "id"));
  const redirectTo = getAdminRedirectTo(formData, "/admin/notifications");

  if (!id) {
    return;
  }

  const client = getSupabaseAdminOrThrow();

  await client.from("notification_reads").upsert({
    notification_id: id,
    user_id: admin.id
  });

  revalidatePath("/admin/notifications");
  redirectWithNotice(redirectTo, "notification-read");
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireRoleAdmin();
  const id = cleanId(formString(formData, "id"));
  const role = parseUserRole(formString(formData, "role"));
  const redirectTo = getAdminRedirectTo(formData, "/admin/users");

  if (!id || id === admin.id) {
    return;
  }

  const { error } = await getSupabaseAdminOrThrow()
    .from("profiles")
    .update({ role })
    .eq("id", id);

  if (error) {
    mutationError(error);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  redirectWithNotice(redirectTo, "user-role-updated");
}
