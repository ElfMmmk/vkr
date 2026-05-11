"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createPreviewAdminSession, getAdminEmail, isAdminPreviewEnabled } from "@/lib/auth";
import { formString } from "@/lib/form";
import { createSupabaseServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(6, "Введите пароль")
});

export type LoginState = {
  message?: string;
};

export async function previewLoginAction(): Promise<void> {
  if (!isAdminPreviewEnabled()) {
    redirect("/admin/login");
  }

  await createPreviewAdminSession();
  redirect("/admin");
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!hasSupabasePublicEnv() || !getAdminEmail()) {
    return {
      message:
        "Админка требует NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY и ADMIN_EMAIL."
    };
  }

  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Проверьте данные входа."
    };
  }

  const allowedEmail = getAdminEmail();
  const email = parsed.data.email.toLowerCase();

  if (allowedEmail && email !== allowedEmail) {
    return {
      message: "У этой учётной записи нет доступа к административной панели."
    };
  }

  const client = await createSupabaseServerClient();

  if (!client) {
    return {
      message: "Supabase не подключён."
    };
  }

  const { error } = await client.auth.signInWithPassword({
    email,
    password: parsed.data.password
  });

  if (error) {
    return {
      message: "Не удалось войти. Проверьте email и пароль."
    };
  }

  redirect("/admin");
}
