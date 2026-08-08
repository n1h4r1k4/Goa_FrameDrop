/**
 * Export: size the canvas per shape, stay under the iOS canvas cap, compose, and
 * return a real PNG Blob. See the frame-generator skill.
 */
import { MAX_CANVAS_AREA, MAX_CANVAS_SIDE, TARGET_DPR } from "./constants";
import {
  compose,
  composeTeam,
  type ComposeInput,
  type TeamComposeInput,
} from "./compose";
import { ensureFontsLoaded } from "./fonts";
import { SHAPE } from "./shapes";

/** Largest safe multiplier for a w×h canvas (>=1, <=TARGET_DPR). */
export function exportScale(w: number, h: number): number {
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (w * h));
  const bySide = MAX_CANVAS_SIDE / Math.max(w, h);
  return Math.max(1, Math.min(TARGET_DPR, byArea, bySide));
}

export type RenderInput = Omit<ComposeInput, "ctx" | "w" | "h">;

/** Render the composed graphic to a PNG Blob at retina resolution. */
export async function renderToBlob(input: RenderInput): Promise<Blob> {
  let w: number;
  let h: number;
  if (input.overlay) {
    w = 1080;
    h = 1080;
  } else {
    const cfg = SHAPE[input.shape ?? "square"];
    const scale = exportScale(cfg.w, cfg.h);
    w = Math.round(cfg.w * scale);
    h = Math.round(cfg.h * scale);
  }

  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  compose({ ...input, ctx, w, h });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new Error("Export failed — the image may be too large for this browser.");
  }
  return blob;
}

/** Compose the graphic onto a canvas element (for use as a WebGL texture). */
export async function renderToCanvas(
  input: RenderInput,
  maxSide = 1024,
): Promise<HTMLCanvasElement> {
  let lw: number;
  let lh: number;
  if (input.overlay) {
    lw = 1080;
    lh = 1080;
  } else {
    const cfg = SHAPE[input.shape ?? "square"];
    lw = cfg.w;
    lh = cfg.h;
  }
  const s = Math.min(1, maxSide / Math.max(lw, lh));
  const w = Math.round(lw * s);
  const h = Math.round(lh * s);
  await ensureFontsLoaded();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  compose({ ...input, ctx, w, h });
  return canvas;
}

export type RenderTeamInput = Omit<TeamComposeInput, "ctx" | "w" | "h"> & {
  size?: number;
};

/** Render a team/combined frame (square) to a PNG Blob. */
export async function renderTeamToBlob(input: RenderTeamInput): Promise<Blob> {
  const S = input.size ?? 1200;
  const scale = exportScale(S, S);
  const side = Math.round(S * scale);

  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  composeTeam({ ...input, ctx, w: side, h: side });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Export failed — the image may be too large.");
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
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
