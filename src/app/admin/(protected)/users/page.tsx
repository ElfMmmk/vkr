import { redirect } from "next/navigation";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateUserRoleAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listUserProfiles } from "@/lib/data/admin";
import type { UserRole } from "@/lib/types";

const roleLabels: Record<UserRole, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  client: "Клиент"
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  if (!admin.canManageRoles) {
    redirect("/admin");
  }

  const profiles = await listUserProfiles();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Доступ</p>
        <h1 className="mt-2 text-4xl font-semibold">Пользователи и роли</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Администратор управляет контентом и ролями, менеджер работает с заявками, клиент видит
          только личный кабинет.
        </p>
      </div>
      <div className="grid gap-4">
        {profiles.map((profile) => (
          <AdminCard
            description={profile.fullName || roleLabels[profile.role]}
            key={profile.id}
            title={profile.email}
          >
            <form action={updateUserRoleAction} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <input name="id" type="hidden" value={profile.id} />
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Роль
                <select
                  className="min-h-11 border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
                  defaultValue={profile.role}
                  disabled={profile.id === admin.id}
                  name="role"
                >
                  {(["admin", "manager", "client"] as UserRole[]).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
              <AdminFormFieldset canWrite={profile.id !== admin.id && admin.canManageRoles}>
                <FormSubmitButton
                  className={adminPrimaryButtonClass}
                  idleLabel="Сохранить роль"
                  pendingLabel="Сохранение..."
                />
              </AdminFormFieldset>
            </form>
          </AdminCard>
        ))}
      </div>
      {!profiles.length ? (
        <div className="border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">Профили пока не созданы</h2>
          <p className="mt-2 text-muted">
            Профиль появляется после входа пользователя или регистрации клиента.
          </p>
        </div>
      ) : null}
    </div>
  );
}
