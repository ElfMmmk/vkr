"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { resolveUserProfile } from "@/lib/auth";
import { fieldLimits } from "@/lib/field-limits";
import { formString } from "@/lib/form";
import { createSupabaseServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

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
    return { message: "Вход клиентов временно недоступен: Supabase не настроен." };
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
    return { message: "Supabase не подключён." };
  }

  const { error } = await client.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: "Не удалось войти. Проверьте email и пароль." };
  }

  redirect("/account");
}

export async function clientRegisterAction(
  _previousState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  if (!hasSupabasePublicEnv()) {
    return { message: "Регистрация клиентов временно недоступна: Supabase не настроен." };
  }

  const parsed = registerSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    fullName: formString(formData, "fullName")
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Проверьте данные регистрации." };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return { message: "Supabase не подключён." };
  }

  const { data, error } = await client.auth.signUp({
    email: parsed.data.email.toLowerCase(),
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

  redirect("/account");
}

export async function clientSignOutAction(): Promise<void> {
  const client = await createSupabaseServerClient();

  if (client) {
    await client.auth.signOut();
  }

  redirect("/");
}
