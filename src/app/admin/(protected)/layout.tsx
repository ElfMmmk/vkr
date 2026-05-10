import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
