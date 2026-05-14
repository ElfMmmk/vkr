"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { formString, formStringArray } from "@/lib/form";
import { calculateOrderEstimate } from "@/lib/order-calculator";
import {
  createSupabaseServerClient,
  getOptionalSupabaseAdmin
} from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { orderRequestSchema } from "@/lib/validation";

export type OrderFormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const MIN_FORM_FILL_MS = 2500;
const REQUEST_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_THROTTLE_LIMIT = 5;

async function getRequestSourceHash(): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const realIp = headerStore.get("x-real-ip")?.trim() ?? "";
  const userAgent = headerStore.get("user-agent")?.trim() ?? "";
  const dayBucket = new Date().toISOString().slice(0, 10);

  return createHash("sha256")
    .update(`${forwardedFor || realIp}|${userAgent}|${dayBucket}`)
    .digest("hex");
}

async function isRequestThrottled(sourceHash: string): Promise<boolean> {
  const adminClient = getOptionalSupabaseAdmin();

  if (!adminClient || !sourceHash) {
    return false;
  }

  const since = new Date(Date.now() - REQUEST_THROTTLE_WINDOW_MS).toISOString();
  const { data, error } = await adminClient
    .from("requests")
    .select("id")
    .eq("source_hash", sourceHash)
    .gte("created_at", since)
    .limit(REQUEST_THROTTLE_LIMIT + 1);

  if (error) {
    return false;
  }

  return (data?.length ?? 0) >= REQUEST_THROTTLE_LIMIT;
}

export async function submitOrderAction(
  _previousState: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const honeypot = formString(formData, "website");
  const startedAt = Number(formString(formData, "formStartedAt"));

  if (honeypot) {
    redirect("/order/success");
  }

  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FORM_FILL_MS) {
    return {
      message: "Форма отправлена слишком быстро. Проверьте данные и попробуйте ещё раз."
    };
  }

  const parsed = orderRequestSchema.safeParse({
    clientName: formString(formData, "clientName"),
    contactMethod: formString(formData, "contactMethod"),
    contactValue: formString(formData, "contactValue"),
    serviceId: formString(formData, "serviceId"),
    packageId: formString(formData, "packageId"),
    addonIds: formStringArray(formData, "addonIds"),
    referenceProjectId: formString(formData, "referenceProjectId") || undefined,
    serviceTitle: formString(formData, "serviceTitle") || undefined,
    resultDescription: formString(formData, "resultDescription"),
    stylePreferences: formString(formData, "stylePreferences"),
    materials: formString(formData, "materials"),
    desiredDeadline: formString(formData, "desiredDeadline"),
    comment: formString(formData, "comment")
  });

  if (!parsed.success) {
    return {
      message: "Заполните обязательные поля",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const adminClient = getOptionalSupabaseAdmin();

  if (!adminClient) {
    return {
      message: "Сохранение заказа временно недоступно. Попробуйте позже."
    };
  }

  const sourceHash = await getRequestSourceHash();

  if (await isRequestThrottled(sourceHash)) {
    return {
      message: "Слишком много заявок за короткое время. Попробуйте позже."
    };
  }

  const serviceId = parsed.data.serviceId;
  const packageId = parsed.data.packageId;
  const uniqueAddonIds = Array.from(new Set(parsed.data.addonIds));
  let serviceTitle = parsed.data.serviceTitle ?? "";
  const readClient = adminClient;
  const { data: service, error: serviceError } = await readClient
    .from("services")
    .select("id, title, is_active, service_packages(*), service_addons(*)")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError || !service || service.is_active !== true || typeof service.title !== "string") {
    return {
      message: "Заполните обязательные поля",
      fieldErrors: {
        serviceId: ["Выберите услугу из списка"]
      }
    };
  }

  serviceTitle = service.title;
  const packages = Array.isArray(service.service_packages) ? service.service_packages : [];
  const addons = Array.isArray(service.service_addons) ? service.service_addons : [];
  const selectedPackage = packages.find(
    (item) => item.id === packageId && item.service_id === serviceId && item.is_active === true
  );

  if (!selectedPackage) {
    return {
      message: "Заполните обязательные поля",
      fieldErrors: {
        packageId: ["Выберите пакет работ"]
      }
    };
  }

  const selectedAddons = uniqueAddonIds.map((addonId) =>
    addons.find((item) => item.id === addonId && item.service_id === serviceId && item.is_active === true)
  );

  if (selectedAddons.some((addon) => !addon)) {
    return {
      message: "Проверьте выбранные доплаты",
      fieldErrors: {
        addonIds: ["Выберите доплаты из списка услуги"]
      }
    };
  }

  let referenceProjectId: string | null = null;
  let referenceProjectTitle = "";
  let referenceProjectSlug = "";

  if (parsed.data.referenceProjectId) {
    const { data: referenceProject } = await readClient
      .from("projects")
      .select("id, title, slug, is_published, project_services(service_id)")
      .eq("id", parsed.data.referenceProjectId)
      .eq("is_published", true)
      .maybeSingle();
    const projectServices = Array.isArray(referenceProject?.project_services)
      ? referenceProject.project_services
      : [];
    const belongsToService = projectServices.some((relation) => relation.service_id === serviceId);

    if (!referenceProject || !belongsToService) {
      return {
        message: "Выберите пример работы из списка услуги",
        fieldErrors: {
          referenceProjectId: ["Выберите пример работы из списка услуги"]
        }
      };
    }

    referenceProjectId = referenceProject.id;
    referenceProjectTitle = referenceProject.title;
    referenceProjectSlug = referenceProject.slug;
  }

  const addonSnapshots = selectedAddons
    .filter((addon): addon is NonNullable<typeof addon> => Boolean(addon))
    .map((addon) => ({
      id: addon.id,
      title: addon.title,
      description: addon.description ?? "",
      price: addon.price ?? 0,
      durationDays: addon.duration_days ?? 0
    }));
  const estimate = calculateOrderEstimate({
    package: {
      priceFrom: selectedPackage.price_from ?? 0,
      priceTo: selectedPackage.price_to ?? 0,
      durationFromDays: selectedPackage.duration_from_days ?? 1,
      durationToDays: selectedPackage.duration_to_days ?? 1
    },
    addons: addonSnapshots
  });

  const sessionClient = await createSupabaseServerClient();
  const { data: userData } = sessionClient
    ? await sessionClient.auth.getUser()
    : { data: { user: null } };
  const clientUserId = userData.user?.id ?? null;
  const requestPayload: TablesInsert<"requests"> = {
    client_name: parsed.data.clientName,
    contact_method: parsed.data.contactMethod,
    contact_value: parsed.data.contactValue,
    service_id: serviceId,
    service_title: serviceTitle,
    package_id: selectedPackage.id,
    package_title: selectedPackage.title,
    package_description: selectedPackage.description ?? "",
    package_price_from: selectedPackage.price_from ?? 0,
    package_price_to: selectedPackage.price_to ?? 0,
    package_duration_from_days: selectedPackage.duration_from_days ?? 1,
    package_duration_to_days: selectedPackage.duration_to_days ?? 1,
    selected_addons: addonSnapshots,
    reference_project_id: referenceProjectId,
    reference_project_title: referenceProjectTitle,
    reference_project_slug: referenceProjectSlug,
    result_description: parsed.data.resultDescription,
    style_preferences: parsed.data.stylePreferences,
    materials: parsed.data.materials,
    desired_deadline: parsed.data.desiredDeadline,
    estimated_price_from: estimate.priceFrom,
    estimated_price_to: estimate.priceTo,
    estimated_duration_from_days: estimate.durationFromDays,
    estimated_duration_to_days: estimate.durationToDays,
    comment: parsed.data.resultDescription,
    source_hash: sourceHash,
    status: "new",
    ...(clientUserId ? { client_user_id: clientUserId } : {})
  };
  const requestInsert = await adminClient
    .from("requests")
    .insert(requestPayload)
    .select("id")
    .single();
  const error = requestInsert.error;

  if (error) {
    return {
      message: "Не удалось сохранить заказ. Попробуйте позже."
    };
  }

  if (requestInsert.data?.id) {
    await adminClient.from("notifications").insert({
      type: "request_created",
      title: "Новый заказ",
      body: `${parsed.data.clientName} оформил(а) заказ${serviceTitle ? `: ${serviceTitle}` : ""}.`,
      entity_type: "request",
      entity_id: requestInsert.data.id,
      audience_role: "manager"
    });
  }

  redirect("/order/success");
}
