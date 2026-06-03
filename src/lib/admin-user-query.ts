import type { UserRole } from "@/lib/types";

export const adminUserPageSize = 12;

export type AdminUserSort = "newest" | "oldest" | "email";

export type AdminUserListOptions = {
  page: number;
  pageSize: number;
  query?: string;
  role?: UserRole;
  sort: AdminUserSort;
};

type RawAdminUserListParams = {
  page?: string;
  query?: string;
  role?: string;
  sort?: string;
};

function normalizeQuery(query: string | undefined): string | undefined {
  const value = query?.trim().replace(/\s+/g, " ");
  return value ? value : undefined;
}

function parsePage(page: string | undefined): number {
  const value = Number(page);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export function isUserRole(value: string | undefined): value is UserRole {
  return value === "admin" || value === "manager" || value === "client";
}

export function parseAdminUserSort(sort: string | undefined): AdminUserSort {
  return sort === "oldest" || sort === "email" ? sort : "newest";
}

export function parseAdminUserListParams(
  params: RawAdminUserListParams,
  pageSize = adminUserPageSize
): AdminUserListOptions {
  const query = normalizeQuery(params.query);
  const role = isUserRole(params.role) ? params.role : undefined;

  return {
    page: parsePage(params.page),
    pageSize,
    ...(query ? { query } : {}),
    ...(role ? { role } : {}),
    sort: parseAdminUserSort(params.sort)
  };
}

export function toAdminUserSearchParams(options: AdminUserListOptions): URLSearchParams {
  const params = new URLSearchParams();

  if (options.query) {
    params.set("query", options.query);
  }

  if (options.role) {
    params.set("role", options.role);
  }

  params.set("sort", options.sort);

  if (options.page > 1) {
    params.set("page", String(options.page));
  }

  return params;
}
