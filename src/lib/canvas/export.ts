/**
 * Export: pick a resolution that stays under the iOS canvas cap, compose, and
 * return a real PNG Blob. See the frame-generator skill.
 */
import {
  EXPORT_SIZE,
  MAX_CANVAS_AREA,
  MAX_CANVAS_SIDE,
  TARGET_DPR,
} from "./constants";
import { compose, type ComposeInput } from "./compose";
import { ensureFontsLoaded } from "./fonts";

/** Largest safe multiplier for a logical w×h square (>=1, <=TARGET_DPR). */
export function exportScale(w = EXPORT_SIZE, h = EXPORT_SIZE): number {
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (w * h));
  const bySide = MAX_CANVAS_SIDE / Math.max(w, h);
  return Math.max(1, Math.min(TARGET_DPR, byArea, bySide));
}

export type RenderInput = Omit<ComposeInput, "ctx" | "side"> & {
  logicalSize?: number;
};

/** Render the composed graphic to a PNG Blob at retina resolution. */
export async function renderToBlob(input: RenderInput): Promise<Blob> {
  const logical = input.logicalSize ?? EXPORT_SIZE;
  const side = Math.round(logical * exportScale(logical, logical));

  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  compose({ ...input, ctx, side });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Export failed — the image may be too large for this browser.");
  }
  return blob;
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename = "hh-goa-2026.png"): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke after the click has been processed
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
