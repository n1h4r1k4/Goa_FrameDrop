/**
 * 3-tier photo decode: native fast-path → lazy libheif WASM for HEIC → <img> fallback.
 * HEIC WASM is dynamically imported ONLY when needed so it stays out of the initial
 * bundle. Always normalize EXIF orientation. See the frame-generator skill.
 */
import type { PhotoSize } from "@/lib/canvas/transform";

export type DecodedPhoto = { bitmap: ImageBitmap; size: PhotoSize };

export const ACCEPT = "image/*,.heic,.heif,.HEIC,.HEIF";

/** Lightweight HEIC/HEIF sniff (extension, mime, or ftyp brand) — no WASM import. */
export async function isHeicFile(file: File): Promise<boolean> {
  const name = file.name.toLowerCase();
  if (/\.(heic|heif|hif)$/.test(name)) return true;
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  try {
    const buf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (String.fromCharCode(...buf.slice(4, 8)) !== "ftyp") return false;
    const brand = String.fromCharCode(...buf.slice(8, 12)).toLowerCase();
    return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(
      brand,
    );
  } catch {
    return false;
  }
}

async function bitmapFromBlob(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}

async function bitmapViaImg(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = url;
    });
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class DecodeError extends Error {}

export async function decodePhoto(file: File): Promise<DecodedPhoto> {
  // Tier 1 — native decode (Safari + modern Chrome handle HEIC; also jpg/png/webp).
  try {
    const bmp = await bitmapFromBlob(file);
    if (bmp.width > 0 && bmp.height > 0) {
      return { bitmap: bmp, size: { width: bmp.width, height: bmp.height } };
    }
  } catch {
    /* fall through */
  }

  // Tier 2 — HEIC via libheif WASM (lazy import; never top-level).
  if (await isHeicFile(file)) {
    try {
      const { heicTo } = await import("heic-to");
      const converted = await heicTo({
        blob: file,
        type: "image/jpeg",
        quality: 0.92,
      });
      const bmp = await bitmapFromBlob(converted);
      return { bitmap: bmp, size: { width: bmp.width, height: bmp.height } };
    } catch {
      /* fall through */
    }
  }

  // Tier 3 — <img> element fallback.
  try {
    const bmp = await bitmapViaImg(file);
    if (bmp.width > 0 && bmp.height > 0) {
      return { bitmap: bmp, size: { width: bmp.width, height: bmp.height } };
    }
  } catch {
    /* fall through */
  }

  throw new DecodeError(
    "Couldn't read this photo. Try a JPG or PNG, or a screenshot.",
  );
}
