const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Downscales a photo in the browser before it is sent to a Server Action.
 * Phone photos are several MB, which would exceed the Server Action body
 * limit; this brings a typical image down to a few hundred KB.
 *
 * Falls back to the original file if anything goes wrong.
 */
export async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    if (!blob) return file;

    return new File([blob], replaceExtension(file.name), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

function replaceExtension(name: string): string {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}
