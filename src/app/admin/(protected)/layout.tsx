import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminShell
      canManageContent={admin.canManageContent}
      canManageRequests={admin.canManageRequests}
      canManageRoles={admin.canManageRoles}
      email={admin.email}
      role={admin.role}
    >
      {children}
    </AdminShell>
  );
}
