import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, textareaClass } from "@/components/form-controls";
import { deleteProjectAction, saveProjectAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminProjects, listAdminServices, listAdminTags } from "@/lib/data/admin";
import type { Project, Service, Tag } from "@/lib/types";

function RelationChecks({
  name,
  items,
  selectedIds
}: {
  name: string;
  items: Array<Service | Tag>;
  selectedIds: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <label className="flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm" key={item.id}>
          <input defaultChecked={selectedIds.includes(item.id)} name={name} type="checkbox" value={item.id} />
          {item.title}
        </label>
      ))}
    </div>
  );
}

function ProjectForm({
  project,
  services,
  tags,
  canWrite
}: {
  project?: Project;
  services: Service[];
  tags: Tag[];
  canWrite: boolean;
}) {
  return (
    <form action={saveProjectAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={project?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название">
            <input className={inputClass} defaultValue={project?.title} name="title" />
          </Field>
          <Field label="Slug">
            <input className={inputClass} defaultValue={project?.slug} name="slug" />
          </Field>
        </div>
        <Field label="Краткое описание">
          <textarea className={textareaClass} defaultValue={project?.shortDescription} name="shortDescription" />
        </Field>
        <Field label="Полное описание">
          <textarea className={`${textareaClass} min-h-44`} defaultValue={project?.fullDescription} name="fullDescription" />
        </Field>
        <Field label="URL обложки">
          <input className={inputClass} defaultValue={project?.coverImageUrl} name="coverImageUrl" />
        </Field>
        <Field label="Связанные услуги">
          <RelationChecks
            items={services}
            name="serviceIds"
            selectedIds={project?.services.map((service) => service.id) ?? []}
          />
        </Field>
        <Field label="Теги">
          <RelationChecks items={tags} name="tagIds" selectedIds={project?.tags.map((tag) => tag.id) ?? []} />
        </Field>
        <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
          <input defaultChecked={project?.isPublished ?? true} name="isPublished" type="checkbox" />
          Опубликован
        </label>
        <button className={adminPrimaryButtonClass}>
          {project ? "Сохранить проект" : "Создать проект"}
        </button>
      </AdminFormFieldset>
    </form>
  );
}

export default async function AdminProjectsPage() {
  const admin = await requireAdmin();
  const [projects, services, tags] = await Promise.all([
    listAdminProjects(),
    listAdminServices(),
    listAdminTags()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Портфолио</p>
        <h1 className="mt-2 text-4xl font-semibold">Проекты</h1>
      </div>
      <AdminCard title="Новый проект">
        <ProjectForm canWrite={admin.canWrite} services={services} tags={tags} />
      </AdminCard>
      <div className="space-y-4">
        {projects.map((project) => (
          <AdminCard key={project.id} title={project.title} description={project.shortDescription}>
            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden bg-line">
                {project.coverImageUrl ? (
                  <Image alt={project.title} className="object-cover" fill src={project.coverImageUrl} />
                ) : null}
              </div>
              <div>
                <p className="text-sm text-muted">
                  {project.isPublished ? "Опубликован" : "Скрыт"} · {project.slug}
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-accent">Редактировать</summary>
                  <div className="mt-5">
                    <ProjectForm canWrite={admin.canWrite} project={project} services={services} tags={tags} />
                  </div>
                </details>
                <form action={deleteProjectAction} className="mt-4">
                  <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                    <input name="id" type="hidden" value={project.id} />
                    <button className={adminDangerButtonClass}>Удалить</button>
                  </AdminFormFieldset>
                </form>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
