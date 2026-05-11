"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { formString } from "@/lib/form";
import { getOptionalSupabaseAdmin, getOptionalSupabasePublic } from "@/lib/supabase/server";
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
    serviceTitle: formString(formData, "serviceTitle") || undefined,
    comment: formString(formData, "comment")
  });

  if (!parsed.success) {
    return {
      message: "Заполните обязательные поля",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const client = getOptionalSupabasePublic();

  if (!client) {
    return {
      message:
        "Заявка прошла проверку, но Supabase ещё не подключён. Настройте переменные окружения для сохранения заявок."
    };
  }

  const sourceHash = await getRequestSourceHash();

  if (await isRequestThrottled(sourceHash)) {
    return {
      message: "Слишком много заявок за короткое время. Попробуйте позже."
    };
  }

  const serviceId = parsed.data.serviceId;
  let serviceTitle = parsed.data.serviceTitle ?? "";

  if (serviceId) {
    const { data: service } = await client
      .from("services")
      .select("title")
      .eq("id", serviceId)
      .eq("is_active", true)
      .maybeSingle();

    if (service && typeof service.title === "string") {
      serviceTitle = service.title;
    } else {
      return {
        message: "Заполните обязательные поля",
        fieldErrors: {
          serviceId: ["Выберите услугу из списка"]
        }
      };
    }
  }

  const { error } = await client.from("requests").insert({
    client_name: parsed.data.clientName,
    contact_method: parsed.data.contactMethod,
    contact_value: parsed.data.contactValue,
    service_id: serviceId,
    service_title: serviceTitle,
    comment: parsed.data.comment,
    source_hash: sourceHash,
    status: "new"
  });

  if (error) {
    return {
      message: "Не удалось сохранить заявку. Попробуйте позже."
    };
  }

  redirect("/order/success");
}
