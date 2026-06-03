import { AdminFormFieldset, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateUserRoleAction } from "@/lib/actions/admin";
import type { UserProfile } from "@/lib/types";
import { userRoleLabels, userRoles } from "@/lib/user-roles";

export function AdminUserRoleForm({
  canManageRoles,
  currentAdminId,
  profile,
  redirectTo
}: {
  canManageRoles: boolean;
  currentAdminId: string;
  profile: UserProfile;
  redirectTo: string;
}) {
  const isSelf = profile.id === currentAdminId;

  return (
    <form action={updateUserRoleAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <input name="id" type="hidden" value={profile.id} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <label className="grid gap-2 text-sm font-semibold text-ink">
        Роль
        <select
          className="min-h-11 border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
          defaultValue={profile.role}
          disabled={isSelf}
          name="role"
        >
          {userRoles.map((role) => (
            <option key={role} value={role}>
              {userRoleLabels[role]}
            </option>
          ))}
        </select>
      </label>
      <AdminFormFieldset canWrite={!isSelf && canManageRoles} className="grid">
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel="Сохранить роль"
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
      {isSelf ? (
        <p className="text-xs leading-5 text-muted md:col-span-2">
          Собственную роль нельзя изменить из панели.
        </p>
      ) : null}
    </form>
  );
}
