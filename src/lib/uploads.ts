export const MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const imageTypeExtensions: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

type UploadFileLike = {
  name: string;
  size: number;
  type: string;
};

export function validatePortfolioImageUpload(file: UploadFileLike): string | null {
  if (file.size <= 0) {
    return "Выберите изображение.";
  }

  if (file.size > MAX_PORTFOLIO_IMAGE_UPLOAD_BYTES) {
    return "Изображение должно быть не больше 10 МБ.";
  }

  if (!allowedImageTypes.has(file.type.toLowerCase())) {
    return "Загрузите JPEG, PNG, WebP, GIF или AVIF изображение.";
  }

  return null;
}

export function getPortfolioImageExtension(file: UploadFileLike): string {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && ["avif", "gif", "jpeg", "jpg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return imageTypeExtensions[file.type.toLowerCase()] ?? "jpg";
}
