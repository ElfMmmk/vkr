import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import { deleteProjectAction, saveProjectAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminImages, listAdminProjects, listAdminServices, listAdminTags } from "@/lib/data/admin";
import type { PortfolioImage, Project, Service, Tag } from "@/lib/types";

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

function imageLabel(image: PortfolioImage): string {
  return image.title || image.caption || image.storagePath || "Без названия";
}

function findCoverImageId(project: Project | undefined, images: PortfolioImage[]): string {
  if (!project?.coverImageUrl) {
    return "";
  }

  return images.find((image) => image.publicUrl === project.coverImageUrl)?.id ?? "";
}

function ImageChecks({
  images,
  selectedIds
}: {
  images: PortfolioImage[];
  selectedIds: string[];
}) {
  if (!images.length) {
    return (
      <p className="border border-line bg-paper px-4 py-3 text-sm text-muted">
        Сначала загрузите изображения в разделе «Изображения».
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {images.map((image) => (
        <label className="flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm" key={image.id}>
          <input defaultChecked={selectedIds.includes(image.id)} name="galleryImageIds" type="checkbox" value={image.id} />
          <span className="min-w-0 truncate">{imageLabel(image)}</span>
        </label>
      ))}
    </div>
  );
}

function ProjectForm({
  project,
  services,
  tags,
  images,
  canWrite
}: {
  project?: Project;
  services: Service[];
  tags: Tag[];
  images: PortfolioImage[];
  canWrite: boolean;
}) {
  const coverImageId = findCoverImageId(project, images);
  const manualCoverUrl = project?.coverImageUrl && !coverImageId ? project.coverImageUrl : "";

  return (
    <form action={saveProjectAction} className="grid gap-4">
      <AdminFormFieldset canWrite={canWrite}>
        <input name="id" type="hidden" value={project?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Название">
            <input className={inputClass} defaultValue={project?.title} name="title" placeholder="Название проекта" />
          </Field>
          <Field
            label="Адрес страницы"
            hint="Можно оставить пустым: адрес создастся автоматически из названия."
          >
            <input className={inputClass} defaultValue={project?.slug} name="slug" placeholder="botanica-lab" />
          </Field>
        </div>
        <Field label="Краткое описание" hint="Показывается в карточке проекта.">
          <textarea
            className={textareaClass}
            defaultValue={project?.shortDescription}
            name="shortDescription"
            placeholder="Коротко о задаче и результате"
          />
        </Field>
        <Field label="Полное описание" hint="Текст внутри страницы кейса.">
          <textarea
            className={`${textareaClass} min-h-44`}
            defaultValue={project?.fullDescription}
            name="fullDescription"
            placeholder="Опишите задачу, решение и итог проекта"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Обложка из медиатеки">
            <select className={selectClass} defaultValue={coverImageId} name="coverImageId">
              <option value="">Без обложки</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  {imageLabel(image)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Внешняя ссылка на обложку" hint="Необязательно, если выбрана обложка из медиатеки.">
            <input
              className={inputClass}
              defaultValue={manualCoverUrl}
              name="coverImageUrl"
              placeholder="https://..."
            />
          </Field>
        </div>
        <Field label="Изображения проекта" hint="Отмеченные файлы появятся в галерее кейса.">
          <ImageChecks
            images={images}
            selectedIds={project?.gallery.map((image) => image.id) ?? []}
          />
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
          Показывать на сайте
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
  const [projects, services, tags, images] = await Promise.all([
    listAdminProjects(),
    listAdminServices(),
    listAdminTags(),
    listAdminImages()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Портфолио</p>
        <h1 className="mt-2 text-4xl font-semibold">Проекты</h1>
      </div>
      <AdminCard title="Новый проект">
        <ProjectForm canWrite={admin.canWrite} images={images} services={services} tags={tags} />
      </AdminCard>
      <div className="space-y-4">
        {projects.map((project) => (
          <AdminCard key={project.id} title={project.title} description={project.shortDescription}>
            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden bg-line">
                {project.coverImageUrl ? (
                  <Image alt={project.title} className="object-cover" fill src={project.coverImageUrl} />
                ) : (
                  <div className="grid h-full place-items-center px-4 text-center text-xs text-muted">
                    Без обложки
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted">
                  {project.isPublished ? "Показывается на сайте" : "Скрыт"} · {project.slug}
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-accent">Редактировать</summary>
                  <div className="mt-5">
                    <ProjectForm
                      canWrite={admin.canWrite}
                      images={images}
                      project={project}
                      services={services}
                      tags={tags}
                    />
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
