import type { UserRole } from "@/lib/types";

export const userRoles: UserRole[] = ["admin", "manager", "client"];

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  client: "Клиент"
};
