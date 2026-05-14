"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminEmail, requireClientSession, resolveUserProfile } from "@/lib/auth";
import { fieldLimits } from "@/lib/field-limits";
import { formString } from "@/lib/form";
import {
  createSupabaseServerClient,
  getSupabaseAdminOrThrow,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";

export type AccountFormState = {
  message?: string;
};

const accountAuthSchema = z.object({
  email: z.string().trim().email("Введите корректный email").max(fieldLimits.login.email.max),
  password: z
    .string()
    .min(fieldLimits.login.password.min, "Пароль должен быть длиннее")
    .max(fieldLimits.login.password.max)
});

const registerSchema = accountAuthSchema.extend({
  fullName: z.string().trim().min(2, "Укажите имя").max(120)
});

export async function clientLoginAction(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  if (!hasSupabasePublicEnv()) {
    return { message: "Вход временно недоступен. Попробуйте позже." };
  }

  const parsed = accountAuthSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Проверьте данные входа." };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: "Вход временно недоступен. Попробуйте позже." };
  }

  const { error } = await client.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: "Не удалось войти. Проверьте email и пароль." };
  }

  redirect("/account?notice=signed-in");
}

export async function clientRegisterAction(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  if (!hasSupabasePublicEnv()) {
    return { message: "Регистрация временно недоступна. Попробуйте позже." };
  }

  const parsed = registerSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    fullName: formString(formData, "fullName")
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Проверьте данные регистрации." };
  }

  const email = parsed.data.email.toLowerCase();
  const adminEmail = getAdminEmail();

  if (adminEmail && email === adminEmail) {
    return {
      message:
        "Этот email используется для административного доступа. Войдите через административную панель."
    };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: "Регистрация временно недоступна. Попробуйте позже." };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName
      }
    }
  });

  if (error) {
    return { message: "Не удалось зарегистрироваться. Проверьте email или попробуйте позже." };
  }

  if (data.user) {
    await resolveUserProfile(data.user);
  }

  if (!data.session) {
    return { message: "Регистрация создана. Проверьте почту, если включено подтверждение email." };
  }

  redirect("/account?notice=registered");
}

export async function clientSignOutAction(): Promise<void> {
  const client = await createSupabaseServerClient();

  if (client) {
    await client.auth.signOut();
  }

  redirect("/");
}

export async function acceptOrderContractAction(formData: FormData): Promise<void> {
  const session = await requireClientSession();
  const requestId = formString(formData, "requestId").trim();
  const contractId = formString(formData, "contractId").trim();

  if (!requestId || !contractId) {
    redirect("/account");
  }

  const client = getSupabaseAdminOrThrow();
  const { data: request } = await client
    .from("requests")
    .select("id, client_user_id, order_contracts(id, status)")
    .eq("id", requestId)
    .maybeSingle();
  const contractRows = Array.isArray(request?.order_contracts)
    ? request.order_contracts
    : request?.order_contracts
      ? [request.order_contracts]
      : [];
  const contract = contractRows.find((item) => item.id === contractId);

  if (request?.client_user_id !== session.id || !contract || contract.status !== "sent") {
    redirect("/account");
  }

  const { data: acceptedContract, error: acceptError } = await client
    .from("order_contracts")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("status", "sent")
    .select("id")
    .maybeSingle();

  if (acceptError || !acceptedContract) {
    redirect("/account?notice=order-contract-accept-failed");
  }

  revalidatePath("/account");
  redirect("/account?notice=order-contract-accepted");
}
