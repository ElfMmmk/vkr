import { redirect } from "next/navigation";

import { createSupabaseServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

export type AdminSession = {
  id: string;
  email: string;
};

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const allowedEmail = getAdminEmail();

  if (!allowedEmail || !hasSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    return null;
  }

  const email = data.user.email.toLowerCase();

  if (email !== allowedEmail) {
    return null;
  }

  return {
    id: data.user.id,
    email
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
