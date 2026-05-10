import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import { Field, inputClass, selectClass } from "@/components/form-controls";
import { deleteImageAction, uploadImageAction } from "@/lib/actions/admin";
import { listAdminImages, listAdminPages, listAdminProjects, listAdminServices } from "@/lib/data/admin";

export default async function AdminImagesPage() {
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
          <button className="focus-ring border border-ink bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-accent">
            Загрузить
          </button>
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
              <input name="id" type="hidden" value={image.id} />
              <input name="storagePath" type="hidden" value={image.storagePath} />
              <button className="focus-ring border border-accent px-3 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white">
                Удалить
              </button>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
