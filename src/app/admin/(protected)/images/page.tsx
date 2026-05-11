import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass, adminPrimaryButtonClass } from "@/components/admin-form-lock";
import { Field, inputClass, selectClass } from "@/components/form-controls";
import { deleteImageAction, uploadImageAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { listAdminImages, listAdminPages, listAdminProjects, listAdminServices } from "@/lib/data/admin";

export default async function AdminImagesPage() {
  const admin = await requireAdmin();
  const [images, projects, pages, services] = await Promise.all([
    listAdminImages(),
    listAdminProjects(),
    listAdminPages(),
    listAdminServices()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Медиа</p>
        <h1 className="mt-2 text-4xl font-semibold">Изображения</h1>
      </div>
      <AdminCard title="Загрузить изображение" description="Файл попадёт в Supabase Storage bucket `portfolio-images`, а связь сохранится в таблице images.">
        <form action={uploadImageAction} className="grid gap-4">
          <AdminFormFieldset canWrite={admin.canWrite}>
            <Field label="Файл">
              <input className={inputClass} name="file" type="file" />
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Тип привязки">
                <select className={selectClass} name="parentType" defaultValue="project">
                  <option value="project">Проект</option>
                  <option value="page">Страница</option>
                  <option value="service">Услуга</option>
                  <option value="free">Без привязки</option>
                </select>
              </Field>
              <Field label="ID родителя">
                <select className={selectClass} name="parentId" defaultValue="">
                  <option value="">Без привязки</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      Проект: {project.title}
                    </option>
                  ))}
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      Страница: {page.title}
                    </option>
                  ))}
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      Услуга: {service.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Порядок">
                <input className={inputClass} defaultValue={100} name="sortOrder" type="number" />
              </Field>
            </div>
            <Field label="Подпись">
              <input className={inputClass} name="caption" />
            </Field>
            <button className={adminPrimaryButtonClass}>Загрузить</button>
          </AdminFormFieldset>
        </form>
      </AdminCard>
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((image) => (
          <AdminCard key={image.id} title={image.caption || image.storagePath} description={image.parentType}>
            <div className="relative aspect-[4/3] overflow-hidden bg-line">
              {image.publicUrl ? (
                <Image alt={image.caption || image.storagePath} className="object-cover" fill src={image.publicUrl} />
              ) : null}
            </div>
            <p className="mt-3 break-all text-xs leading-5 text-muted">{image.storagePath}</p>
            <form action={deleteImageAction} className="mt-4">
              <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                <input name="id" type="hidden" value={image.id} />
                <input name="storagePath" type="hidden" value={image.storagePath} />
                <button className={adminDangerButtonClass}>Удалить</button>
              </AdminFormFieldset>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
