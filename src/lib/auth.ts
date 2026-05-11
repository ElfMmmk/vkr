import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createSupabaseServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

const ADMIN_PREVIEW_COOKIE = "admin_preview_session";
const ADMIN_PREVIEW_COOKIE_VALUE = "enabled";

export type AdminSession = {
  id: string;
  email: string;
  mode: "supabase" | "preview";
  canWrite: boolean;
};

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

export function isAdminPreviewEnabled(): boolean {
  return process.env.ADMIN_PREVIEW_MODE === "true" && process.env.NODE_ENV !== "production";
}

export function getPreviewAdminEmail(): string {
  return process.env.ADMIN_PREVIEW_EMAIL?.trim().toLowerCase() || "admin-preview@local.test";
}

export async function createPreviewAdminSession(): Promise<void> {
  if (!isAdminPreviewEnabled()) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_PREVIEW_COOKIE, ADMIN_PREVIEW_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearPreviewAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_PREVIEW_COOKIE);
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  if (isAdminPreviewEnabled()) {
    const cookieStore = await cookies();
    const previewCookie = cookieStore.get(ADMIN_PREVIEW_COOKIE);

    if (previewCookie?.value === ADMIN_PREVIEW_COOKIE_VALUE) {
      return {
        id: "preview-admin",
        email: getPreviewAdminEmail(),
        mode: "preview",
        canWrite: false
      };
    }
  }

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
    email,
    mode: "supabase",
    canWrite: true
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireWritableAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();

  if (!admin.canWrite) {
    throw new Error("Preview admin mode is read-only.");
  }

  return admin;
}
