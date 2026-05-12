import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import {
  createSupabaseServerClient,
  getOptionalSupabaseAdmin,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";

const ADMIN_PREVIEW_COOKIE = "admin_preview_session";
const ADMIN_PREVIEW_COOKIE_VALUE = "enabled";

export type UserRole = "admin" | "manager" | "client";

export type AppSession = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type AdminSession = {
  id: string;
  email: string;
  mode: "supabase" | "preview";
  role: UserRole | "preview";
  canWrite: boolean;
  canManageContent: boolean;
  canManageRequests: boolean;
  canManageRoles: boolean;
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

export function isPrivilegedRole(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageContent(role: UserRole | "preview"): boolean {
  return role === "admin";
}

export function canManageRequests(role: UserRole | "preview"): boolean {
  return role === "admin" || role === "manager";
}

export function canManageRoles(role: UserRole | "preview"): boolean {
  return role === "admin";
}

function getBootstrapRole(email: string): UserRole {
  return email === getAdminEmail() ? "admin" : "client";
}

export async function resolveUserProfile(user: User): Promise<AppSession> {
  const email = user.email?.trim().toLowerCase() || "";
  const fallbackRole = getBootstrapRole(email);
  const fallbackName = user.user_metadata?.full_name;
  const fallbackFullName = typeof fallbackName === "string" ? fallbackName : "";
  const adminClient = getOptionalSupabaseAdmin();

  if (!adminClient) {
    return {
      id: user.id,
      email,
      fullName: fallbackFullName,
      role: fallbackRole
    };
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      id: user.id,
      email,
      fullName: fallbackFullName,
      role: fallbackRole
    };
  }

  if (!data) {
    const { data: inserted } = await adminClient
      .from("profiles")
      .insert({
        id: user.id,
        email,
        full_name: fallbackFullName,
        role: fallbackRole
      })
      .select("id, email, full_name, role")
      .maybeSingle();

    return {
      id: user.id,
      email,
      fullName: typeof inserted?.full_name === "string" ? inserted.full_name : fallbackFullName,
      role: inserted?.role === "admin" || inserted?.role === "manager" || inserted?.role === "client"
        ? inserted.role
        : fallbackRole
    };
  }

  if (fallbackRole === "admin" && data.role !== "admin") {
    await adminClient.from("profiles").update({ role: "admin", email }).eq("id", user.id);

    return {
      id: user.id,
      email,
      fullName: typeof data.full_name === "string" ? data.full_name : fallbackFullName,
      role: "admin"
    };
  }

  return {
    id: user.id,
    email,
    fullName: typeof data.full_name === "string" ? data.full_name : fallbackFullName,
    role: data.role === "admin" || data.role === "manager" || data.role === "client"
      ? data.role
      : fallbackRole
  };
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
        role: "preview",
        canWrite: false,
        canManageContent: false,
        canManageRequests: false,
        canManageRoles: false
      };
    }
  }

  if (!hasSupabasePublicEnv()) {
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

  const profile = await resolveUserProfile(data.user);

  if (!isPrivilegedRole(profile.role)) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    mode: "supabase",
    role: profile.role,
    canWrite: canManageContent(profile.role),
    canManageContent: canManageContent(profile.role),
    canManageRequests: canManageRequests(profile.role),
    canManageRoles: canManageRoles(profile.role)
  };
}

export async function getCurrentAppSession(): Promise<AppSession | null> {
  if (!hasSupabasePublicEnv()) {
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

  return resolveUserProfile(data.user);
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

  if (!admin.canManageContent) {
    throw new Error("This action requires the admin role.");
  }

  return admin;
}

export async function requireContentAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();

  if (!admin.canManageContent && admin.mode !== "preview") {
    redirect("/admin");
  }

  return admin;
}

export async function requireRequestManager(): Promise<AdminSession> {
  const admin = await requireAdmin();

  if (!admin.canManageRequests && admin.mode !== "preview") {
    throw new Error("This action requires request manager permissions.");
  }

  return admin;
}

export async function requireRoleAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();

  if (!admin.canManageRoles) {
    throw new Error("This action requires role administrator permissions.");
  }

  return admin;
}

export async function requireClientSession(): Promise<AppSession> {
  const session = await getCurrentAppSession();

  if (!session) {
    redirect("/account/login");
  }

  return session;
}
