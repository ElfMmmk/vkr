import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import { AdminImageMultiSelect } from "@/components/admin-image-multi-select";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { AdminProjectOrderForm } from "@/components/admin-project-order-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Field, inputClass, selectClass, textareaClass } from "@/components/form-controls";
import { LimitedInput, LimitedTextarea } from "@/components/limited-text-control";
import { deleteProjectAction, saveProjectAction } from "@/lib/actions/admin";
import { requireContentAdmin } from "@/lib/auth";
import { listAdminImages, listAdminProjects, listAdminServices, listAdminTags } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";
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
  if (!project?.coverImageUrl && !project?.coverImageId) {
    return "";
  }

  return project.coverImageId ?? images.find((image) => image.publicUrl === project.coverImageUrl)?.id ?? "";
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
          <Field label="Название" required>
            <LimitedInput
              className={inputClass}
              defaultValue={project?.title}
              maxLength={fieldLimits.project.title.max}
              minLength={fieldLimits.project.title.min}
              name="title"
              placeholder="Название проекта"
              required
            />
          </Field>
          <Field
            label="Адрес страницы"
            hint="Можно оставить пустым: адрес создастся автоматически из названия"
          >
            <LimitedInput
              className={inputClass}
              defaultValue={project?.slug}
              maxLength={fieldLimits.project.slug.max}
              minLength={fieldLimits.project.slug.min}
              name="slug"
              placeholder="botanica-lab"
            />
          </Field>
        </div>
        <Field label="Краткое описание" hint="Показывается в карточке проекта" required>
          <LimitedTextarea
            className={textareaClass}
            defaultValue={project?.shortDescription}
            maxLength={fieldLimits.project.shortDescription.max}
            minLength={fieldLimits.project.shortDescription.min}
            name="shortDescription"
            placeholder="Коротко о задаче и результате"
            required
          />
        </Field>
        <Field label="Полное описание" hint="Текст внутри страницы кейса" required>
          <LimitedTextarea
            className={`${textareaClass} min-h-44`}
            defaultValue={project?.fullDescription}
            maxLength={fieldLimits.project.fullDescription.max}
            minLength={fieldLimits.project.fullDescription.min}
            name="fullDescription"
            placeholder="Опишите задачу, решение и итог проекта"
            required
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
          <Field label="Внешняя ссылка на обложку" hint="Необязательно, если выбрана обложка из медиатеки">
            <LimitedInput
              className={inputClass}
              defaultValue={manualCoverUrl}
              maxLength={fieldLimits.project.coverImageUrl.max}
              name="coverImageUrl"
              placeholder="https://..."
            />
          </Field>
        </div>
        <Field label="Галерея проекта" hint="Отметьте изображения, которые должны появиться в галерее кейса. Один файл можно использовать в нескольких проектах">
          {images.length ? (
            <AdminImageMultiSelect
              images={images}
              selectedIds={project?.gallery.map((image) => image.id) ?? []}
            />
          ) : (
            <p className="border border-line bg-paper px-4 py-3 text-sm text-muted">
              Сначала загрузите изображения в разделе «Изображения»
            </p>
          )}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
            <input defaultChecked={project?.isFeatured ?? false} name="isFeatured" type="checkbox" />
            Закрепить сверху
          </label>
          <label className="flex items-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold">
            <input defaultChecked={project?.isPublished ?? true} name="isPublished" type="checkbox" />
            Показывать на сайте
          </label>
        </div>
        <FormSubmitButton
          className={adminPrimaryButtonClass}
          idleLabel={project ? "Сохранить проект" : "Создать проект"}
          pendingLabel="Сохранение..."
        />
      </AdminFormFieldset>
    </form>
  );
}

export default async function AdminProjectsPage() {
  const admin = await requireContentAdmin();
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
      <AdminCard title="Новый проект" description="Можно закрепить до 6 проектов: они будут показываться первыми на главной и в портфолио">
        <ProjectForm canWrite={admin.canWrite} images={images} services={services} tags={tags} />
      </AdminCard>
      <AdminCard title="Порядок на сайте" description="Перетащите проекты в нужной последовательности и сохраните порядок. Закреплённые проекты всё равно будут показываться выше остальных">
        <AdminProjectOrderForm canWrite={admin.canWrite} projects={projects} />
      </AdminCard>
      <div className="space-y-4">
        {projects.map((project) => (
          <AdminCard key={project.id} title={project.title} description={project.shortDescription}>
            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden bg-line">
                {project.coverImageUrl ? (
                  <Image
                    alt={project.title}
                    className="object-cover"
                    fill
                    sizes="180px"
                    src={project.coverImageUrl}
                  />
                ) : (
                  <div className="grid h-full place-items-center px-4 text-center text-xs text-muted">
                    Без обложки
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                  {project.isFeatured ? (
                    <span className="border border-accent/25 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      Закреплён
                    </span>
                  ) : null}
                  <span>{project.isPublished ? "Показывается на сайте" : "Скрыт"}</span>
                  <span>·</span>
                  <span>{project.slug}</span>
                </div>
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
                    <ConfirmSubmitButton
                      className={adminDangerButtonClass}
                      message="Подтвердите удаление проекта. Это действие нельзя отменить."
                    >
                      Удалить
                    </ConfirmSubmitButton>
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
