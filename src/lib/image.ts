export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const COMPRESSED_MAX_SIDE = 1600;
const COMPRESSED_QUALITY = 0.85;
const THUMBNAIL_MAX_SIDE = 200;
const THUMBNAIL_QUALITY = 0.7;

async function drawResizedImage(file: File, maxSide: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível processar a imagem.");

  // Fundo branco para PNGs transparentes não ficarem pretos ao virar JPEG
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas;
}

export async function compressImage(file: File): Promise<File> {
  const canvas = await drawResizedImage(file, COMPRESSED_MAX_SIDE);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", COMPRESSED_QUALITY),
  );
  if (!blob) throw new Error("Não foi possível comprimir a imagem.");

  const fileName = file.name.replace(/\.\w+$/, ".jpg");
  return new File([blob], fileName, { type: "image/jpeg" });
}

export async function createThumbnail(file: File): Promise<string> {
  const canvas = await drawResizedImage(file, THUMBNAIL_MAX_SIDE);
  return canvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY);
}
