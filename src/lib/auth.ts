import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import {
  createSupabaseServerClient,
  getOptionalSupabaseAdmin,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";

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
  role: UserRole;
  canWrite: boolean;
  canManageContent: boolean;
  canManageRequests: boolean;
  canManageRoles: boolean;
};

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

export function isPrivilegedRole(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageContent(role: UserRole): boolean {
  return role === "admin";
}

export function canManageRequests(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageRoles(role: UserRole): boolean {
  return role === "admin";
}

export async function resolveUserProfile(user: User): Promise<AppSession> {
  const email = user.email?.trim().toLowerCase() || "";
  const fallbackRole: UserRole = "client";
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

  return {
    id: user.id,
    email,
    fullName: typeof data.full_name === "string" ? data.full_name : fallbackFullName,
    role: data.role === "admin" || data.role === "manager" || data.role === "client"
      ? data.role
      : fallbackRole
  };
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
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

  if (!admin.canManageContent) {
    redirect("/admin");
  }

  return admin;
}

export async function requireRequestManager(): Promise<AdminSession> {
  const admin = await requireAdmin();

  if (!admin.canManageRequests) {
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
