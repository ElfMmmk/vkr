import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import {
  AdminFormFieldset,
  adminDangerButtonClass,
  adminPrimaryButtonClass
} from "@/components/admin-form-lock";
import { AdminImageUploadForm } from "@/components/admin-image-upload-form";
import {
  AdminTranslatedFields,
  type AdminTranslatedField
} from "@/components/admin-translated-fields";
import { FormSubmitButton } from "@/components/form-submit-button";
import { deleteImageAction, saveImageTextAction } from "@/lib/actions/admin";
import { requireContentAdmin } from "@/lib/auth";
import { listAdminImages } from "@/lib/data/admin";
import { fieldLimits } from "@/lib/field-limits";

const imageTextFields: AdminTranslatedField[] = [
  {
    name: "title",
    label: "Название",
    maxLength: fieldLimits.image.title.max,
    placeholder: "Обложка проекта"
  },
  {
    name: "caption",
    label: "Описание",
    maxLength: fieldLimits.image.caption.max,
    placeholder: "Что изображено или где использовать файл"
  }
];

export default async function AdminImagesPage() {
  const admin = await requireContentAdmin();
  const images = await listAdminImages();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Медиа</p>
        <h1 className="mt-2 text-4xl font-semibold">Изображения</h1>
      </div>
      <AdminCard
        title="Загрузить изображение"
        description="JPEG, PNG, WebP, GIF или AVIF до 10 МБ."
      >
        <AdminImageUploadForm canWrite={admin.canWrite} />
      </AdminCard>
      <div className="grid gap-4 md:grid-cols-3">
        {images.map((image) => (
          <AdminCard
            key={image.id}
            title={image.title || image.caption || image.storagePath}
            description={image.caption || "Без описания"}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-line">
              {image.publicUrl ? (
                <Image
                  alt={image.title || image.caption || image.storagePath}
                  className="object-cover"
                  fill
                  sizes="(min-width: 900px) 33vw, 100vw"
                  src={image.publicUrl}
                />
              ) : null}
            </div>
            <p className="mt-3 break-all text-xs leading-5 text-muted">{image.storagePath}</p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-accent">
                Редактировать текст
              </summary>
              <form action={saveImageTextAction} className="mt-4 grid gap-4">
                <AdminFormFieldset canWrite={admin.canWrite}>
                  <input name="id" type="hidden" value={image.id} />
                  <input name="sortOrder" type="hidden" value={image.sortOrder} />
                  <AdminTranslatedFields
                    english={image.englishTranslation}
                    entityType="image"
                    fields={imageTextFields}
                    russian={{
                      title: image.title,
                      caption: image.caption
                    }}
                  />
                  <FormSubmitButton
                    className={adminPrimaryButtonClass}
                    idleLabel="Сохранить текст"
                    pendingLabel="Сохранение..."
                  />
                </AdminFormFieldset>
              </form>
            </details>
            <form action={deleteImageAction} className="mt-4">
              <AdminFormFieldset canWrite={admin.canWrite} className="inline-grid">
                <input name="id" type="hidden" value={image.id} />
                <button className={adminDangerButtonClass}>Удалить</button>
              </AdminFormFieldset>
            </form>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
