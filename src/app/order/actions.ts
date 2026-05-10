"use server";

import { redirect } from "next/navigation";

import { formString } from "@/lib/form";
import { getOptionalSupabaseAdmin } from "@/lib/supabase/server";
import { orderRequestSchema } from "@/lib/validation";

export type OrderFormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitOrderAction(
  _previousState: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const parsed = orderRequestSchema.safeParse({
    clientName: formString(formData, "clientName"),
    contactMethod: formString(formData, "contactMethod"),
    contactValue: formString(formData, "contactValue"),
    serviceId: formString(formData, "serviceId") || undefined,
    serviceTitle: formString(formData, "serviceTitle") || undefined,
    comment: formString(formData, "comment")
  });

  if (!parsed.success) {
    return {
      message: "Проверьте поля формы.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const client = getOptionalSupabaseAdmin();

  if (!client) {
    return {
      message:
        "Заявка прошла проверку, но Supabase ещё не подключён. Настройте переменные окружения для сохранения заявок."
    };
  }

  const serviceId = parsed.data.serviceId || null;
  let serviceTitle = parsed.data.serviceTitle ?? "";

  if (serviceId) {
    const { data: service } = await client
      .from("services")
      .select("title")
      .eq("id", serviceId)
      .maybeSingle();

    if (service && typeof service.title === "string") {
      serviceTitle = service.title;
    }
  }

  const { error } = await client.from("requests").insert({
    client_name: parsed.data.clientName,
    contact_method: parsed.data.contactMethod,
    contact_value: parsed.data.contactValue,
    service_id: serviceId,
    service_title: serviceTitle,
    comment: parsed.data.comment,
    status: "new"
  });

  if (error) {
    return {
      message: "Не удалось сохранить заявку. Попробуйте позже."
    };
  }

  redirect("/order/success");
}
