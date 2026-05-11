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

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function validatePortfolioImageBytes(file: UploadFileLike, bytes: ArrayBuffer): string | null {
  const view = new Uint8Array(bytes.slice(0, 32));
  const type = file.type.toLowerCase();

  if (type === "image/jpeg") {
    return startsWithBytes(view, [0xff, 0xd8, 0xff]) ? null : "Файл не похож на JPEG изображение.";
  }

  if (type === "image/png") {
    return startsWithBytes(view, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ? null
      : "Файл не похож на PNG изображение.";
  }

  if (type === "image/gif") {
    const header = new TextDecoder("ascii").decode(view.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a"
      ? null
      : "Файл не похож на GIF изображение.";
  }

  if (type === "image/webp") {
    const riff = new TextDecoder("ascii").decode(view.slice(0, 4));
    const webp = new TextDecoder("ascii").decode(view.slice(8, 12));
    return riff === "RIFF" && webp === "WEBP" ? null : "Файл не похож на WebP изображение.";
  }

  if (type === "image/avif") {
    const ftyp = new TextDecoder("ascii").decode(view.slice(4, 8));
    const brands = new TextDecoder("ascii").decode(view.slice(8, 24));
    return ftyp === "ftyp" && (brands.includes("avif") || brands.includes("avis"))
      ? null
      : "Файл не похож на AVIF изображение.";
  }

  return "Неподдерживаемый тип изображения.";
}

export function getPortfolioImageExtension(file: UploadFileLike): string {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && ["avif", "gif", "jpeg", "jpg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return imageTypeExtensions[file.type.toLowerCase()] ?? "jpg";
}
