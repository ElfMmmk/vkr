import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminCard } from "@/components/admin-card";
import { AdminUserRoleForm } from "@/components/admin-user-role-form";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getUserProfileById, listUserRequests } from "@/lib/data/admin";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";
import { userRoleLabels } from "@/lib/user-roles";

type AdminUserDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined): string {
  return value ? new Date(value).toLocaleString("ru-RU") : "—";
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const admin = await requireAdmin();

  if (!admin.canManageRoles) {
    redirect("/admin");
  }

  const { id } = await params;
  const [profile, requests] = await Promise.all([
    getUserProfileById(id),
    listUserRequests(id)
  ]);

  if (!profile) {
    notFound();
  }

  const redirectTo = `/admin/users/${profile.id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
          href="/admin/users"
        >
          Назад к пользователям
        </Link>
        <p className="mt-5 text-sm uppercase tracking-[0.18em] text-muted">Профиль</p>
        <h1 className="mt-2 break-words text-4xl font-semibold">{profile.email}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AdminCard title="Данные пользователя" description={profile.id}>
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">Email</dt>
              <dd className="mt-1 break-words text-muted">{profile.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Имя</dt>
              <dd className="mt-1 text-muted">{profile.fullName || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Роль</dt>
              <dd className="mt-1 text-muted">{userRoleLabels[profile.role]}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Создан</dt>
              <dd className="mt-1 text-muted">{formatDate(profile.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Обновлён</dt>
              <dd className="mt-1 text-muted">{formatDate(profile.updatedAt)}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard title="Роль">
          <AdminUserRoleForm
            canManageRoles={admin.canManageRoles}
            currentAdminId={admin.id}
            profile={profile}
            redirectTo={redirectTo}
          />
        </AdminCard>
      </div>

      <AdminCard
        title="Заявки пользователя"
        description={requests.length ? `${requests.length} шт.` : "Заявок пока нет"}
      >
        {requests.length ? (
          <div className="grid gap-4">
            {requests.map((request) => (
              <article className="border border-line bg-paper p-4" key={request.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{request.clientName}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(request.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-4 grid gap-2 text-sm leading-6 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Контакт:</span> {request.contactMethod},{" "}
                    {request.contactValue}
                  </p>
                  <p>
                    <span className="font-semibold">Услуга:</span>{" "}
                    {request.serviceTitle || "Не выбрана"}
                  </p>
                  {request.packageTitle ? (
                    <p className="md:col-span-2">
                      <span className="font-semibold">Пакет:</span> {request.packageTitle},{" "}
                      {formatPriceRange(request.estimatedPriceFrom, request.estimatedPriceTo)} ·{" "}
                      {formatDurationRange(
                        request.estimatedDurationFromDays,
                        request.estimatedDurationToDays
                      )}
                    </p>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {request.resultDescription || request.comment}
                </p>
                <Link
                  className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-white active:translate-y-px"
                  href={`/admin/requests/${request.id}`}
                >
                  Открыть заказ
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-line bg-paper p-8 text-center">
            <h2 className="text-xl font-semibold">Заявки не найдены</h2>
            <p className="mt-2 text-sm text-muted">
              Связанные заявки появятся здесь, если клиент отправит заказ из своего аккаунта.
            </p>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
