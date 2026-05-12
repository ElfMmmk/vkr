import Image from "next/image";

import { AdminCard } from "@/components/admin-card";
import { AdminFormFieldset, adminDangerButtonClass } from "@/components/admin-form-lock";
import { AdminImageUploadForm } from "@/components/admin-image-upload-form";
import { deleteImageAction } from "@/lib/actions/admin";
import { requireContentAdmin } from "@/lib/auth";
import { listAdminImages } from "@/lib/data/admin";

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
