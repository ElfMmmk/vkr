"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isPrivilegedRole, resolveUserProfile } from "@/lib/auth";
import { fieldLimits } from "@/lib/field-limits";
import { formString } from "@/lib/form";
import { createSupabaseServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email").max(fieldLimits.login.email.max),
  password: z.string().min(fieldLimits.login.password.min, "Введите пароль").max(fieldLimits.login.password.max)
});

export type LoginState = {
  message?: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!hasSupabasePublicEnv()) {
    return {
      message:
        "Вход временно недоступен. Попробуйте позже."
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

  const email = parsed.data.email.toLowerCase();

  const client = await createSupabaseServerClient();

  if (!client) {
    return {
      message: "Вход временно недоступен. Попробуйте позже."
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

  const { data: userData } = await client.auth.getUser();
  const profile = userData.user ? await resolveUserProfile(userData.user) : null;

  if (!profile || !isPrivilegedRole(profile.role)) {
    await client.auth.signOut();

    return {
      message: "У этой учётной записи нет доступа к административной панели."
    };
  }

  redirect("/admin?notice=admin-signed-in");
}
