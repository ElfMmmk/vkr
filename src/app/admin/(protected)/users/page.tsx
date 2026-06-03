import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminCard } from "@/components/admin-card";
import { AdminUserRoleForm } from "@/components/admin-user-role-form";
import { Field, inputClass, selectClass } from "@/components/form-controls";
import { parseAdminUserListParams, toAdminUserSearchParams } from "@/lib/admin-user-query";
import { requireAdmin } from "@/lib/auth";
import { listUserProfiles } from "@/lib/data/admin";
import { userRoleLabels, userRoles } from "@/lib/user-roles";

type AdminUsersPageProps = {
  searchParams: Promise<{
    page?: string;
    query?: string;
    role?: string;
    sort?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | undefined): string {
  return value ? new Date(value).toLocaleString("ru-RU") : "—";
}

function buildUsersHref(options: ReturnType<typeof parseAdminUserListParams>): string {
  const params = toAdminUserSearchParams(options);
  const query = params.toString();

  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const admin = await requireAdmin();

  if (!admin.canManageRoles) {
    redirect("/admin");
  }

  const params = await searchParams;
  const options = parseAdminUserListParams(params);
  const profiles = await listUserProfiles(options);
  const redirectTo = buildUsersHref(options);
  const activeFilters = [
    options.query ? `Поиск: ${options.query}` : null,
    options.role ? `Роль: ${userRoleLabels[options.role]}` : null,
    options.sort === "oldest" ? "Сортировка: сначала старые" : null,
    options.sort === "email" ? "Сортировка: email" : null
  ].filter((item): item is string => Boolean(item));
  const hasFilter = activeFilters.length > 0;
  const from = profiles.total ? (profiles.page - 1) * profiles.pageSize + 1 : 0;
  const to = Math.min(profiles.page * profiles.pageSize, profiles.total);

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

      <AdminCard title="Поиск и фильтр">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_220px_auto]" method="get">
          <Field label="Поиск">
            <input
              className={inputClass}
              defaultValue={options.query}
              name="query"
              placeholder="Email или имя"
            />
          </Field>
          <Field label="Роль">
            <select className={selectClass} defaultValue={options.role ?? ""} name="role">
              <option value="">Все роли</option>
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {userRoleLabels[role]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Сортировка">
            <select className={selectClass} defaultValue={options.sort} name="sort">
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="email">Email</option>
            </select>
          </Field>
          <button className="focus-ring inline-flex min-h-11 items-center justify-center self-end border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px">
            Применить
          </button>
        </form>
        {hasFilter ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Установлено
            </span>
            {activeFilters.map((filter) => (
              <span className="border border-line bg-paper px-3 py-1.5 text-sm text-ink" key={filter}>
                {filter}
              </span>
            ))}
            <Link
              className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
              href="/admin/users"
            >
              Сбросить фильтр
            </Link>
          </div>
        ) : null}
      </AdminCard>

      <AdminCard
        title="Список пользователей"
        description={
          profiles.total
            ? `${from}–${to} из ${profiles.total}`
            : "Пользователи по текущим условиям не найдены"
        }
      >
        {profiles.items.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[minmax(220px,1.4fr)_minmax(160px,1fr)_130px_160px_160px_120px] border-b border-line bg-paper px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                <span>Email</span>
                <span>Имя</span>
                <span>Роль</span>
                <span>Создан</span>
                <span>Обновлён</span>
                <span>Действия</span>
              </div>
              <div className="divide-y divide-line">
                {profiles.items.map((profile) => (
                  <article
                    className="grid grid-cols-[minmax(220px,1.4fr)_minmax(160px,1fr)_130px_160px_160px_120px] items-start gap-3 px-4 py-4 text-sm"
                    key={profile.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{profile.email}</p>
                      <p className="mt-1 truncate text-xs text-muted">{profile.id}</p>
                    </div>
                    <p className="min-w-0 truncate text-muted">{profile.fullName || "—"}</p>
                    <span className="inline-flex w-fit border border-line bg-paper px-2 py-1 text-xs font-semibold text-ink">
                      {userRoleLabels[profile.role]}
                    </span>
                    <p className="text-muted">{formatDate(profile.createdAt)}</p>
                    <p className="text-muted">{formatDate(profile.updatedAt)}</p>
                    <Link
                      className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
                      href={`/admin/users/${profile.id}`}
                    >
                      Открыть
                    </Link>
                    <div className="col-span-6 border-t border-line pt-3">
                      <AdminUserRoleForm
                        canManageRoles={admin.canManageRoles}
                        currentAdminId={admin.id}
                        profile={profile}
                        redirectTo={redirectTo}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-line bg-paper p-8 text-center">
            <h2 className="text-xl font-semibold">Пользователи не найдены</h2>
            <p className="mt-2 text-sm text-muted">
              Измените поиск или фильтр роли, чтобы расширить выдачу.
            </p>
          </div>
        )}

        {profiles.pageCount > 1 ? (
          <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              Страница {profiles.page} из {profiles.pageCount}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                aria-disabled={profiles.page <= 1}
                className={`focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px ${
                  profiles.page <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
                href={buildUsersHref({ ...options, page: Math.max(1, profiles.page - 1) })}
              >
                Назад
              </Link>
              <Link
                aria-disabled={profiles.page >= profiles.pageCount}
                className={`focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px ${
                  profiles.page >= profiles.pageCount ? "pointer-events-none opacity-40" : ""
                }`}
                href={buildUsersHref({
                  ...options,
                  page: Math.min(profiles.pageCount, profiles.page + 1)
                })}
              >
                Вперёд
              </Link>
            </div>
          </nav>
        ) : null}
      </AdminCard>
    </div>
  );
}
