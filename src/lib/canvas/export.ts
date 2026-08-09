/**
 * Export: size the canvas per shape, stay under the iOS canvas cap, compose, and
 * return a real PNG Blob. See the frame-generator skill.
 */
import { MAX_CANVAS_AREA, MAX_CANVAS_SIDE, TARGET_DPR } from "./constants";
import {
  compose,
  composeCardBack,
  composeShareCard,
  composeTeam,
  type ComposeInput,
  type Identity,
  type TeamComposeInput,
} from "./compose";
import { ensureFontsLoaded } from "./fonts";
import { SHAPE } from "./shapes";
import type { FrameStyle } from "./styles";

/** Largest safe multiplier for a w×h canvas (>=1, <=TARGET_DPR). */
export function exportScale(w: number, h: number): number {
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (w * h));
  const bySide = MAX_CANVAS_SIDE / Math.max(w, h);
  return Math.max(1, Math.min(TARGET_DPR, byArea, bySide));
}

export type RenderInput = Omit<ComposeInput, "ctx" | "w" | "h"> & {
  /** export the QR side instead of the photo side */
  back?: boolean;
  /** wording on the card back ("BUILDER PASS" / "CREW PASS") */
  backLabel?: string;
};

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

  if (input.back) {
    composeCardBack(
      ctx,
      w,
      h,
      input.identity,
      input.style,
      input.finalized ?? true,
      input.backLabel,
    );
  } else {
    compose({ ...input, ctx, w, h });
  }

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

/** Render just a card back (crew pass, or any card whose front isn't a photo). */
export async function renderCardBackToBlob(input: {
  w: number;
  h: number;
  identity?: Identity;
  style?: FrameStyle;
  finalized?: boolean;
  label?: string;
}): Promise<Blob> {
  const scale = exportScale(input.w, input.h);
  await ensureFontsLoaded();

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(input.w * scale);
  canvas.height = Math.round(input.h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  composeCardBack(
    ctx,
    canvas.width,
    canvas.height,
    input.identity,
    input.style,
    input.finalized ?? true,
    input.label,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Export failed — the image may be too large.");
  return blob;
}

/** Fixed 1.9:1 plate X will render as a large image card. */
export const SHARE_CARD = { w: 1200, h: 630 } as const;

/**
 * Composite an already-rendered pass onto the 1200×630 share plate. Pass `back`
 * as well and both faces land on the plate — the link preview is the only image
 * X shows, so the QR side has to ride along on it.
 */
export async function renderShareCardToBlob(input: {
  pass: HTMLCanvasElement;
  back?: HTMLCanvasElement | null;
  style?: FrameStyle;
  identity?: Identity;
  label?: string;
}): Promise<Blob> {
  await ensureFontsLoaded();
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD.w;
  canvas.height = SHARE_CARD.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  const faces = [{ img: input.pass, w: input.pass.width, h: input.pass.height }];
  if (input.back) {
    faces.push({ img: input.back, w: input.back.width, h: input.back.height });
  }
  composeShareCard(
    ctx,
    canvas.width,
    canvas.height,
    faces,
    input.style,
    input.identity,
    input.label,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Share card export failed.");
  return blob;
}

/** Card back onto a canvas element (for use as a WebGL texture). */
export async function renderCardBackToCanvas(
  input: {
    w: number;
    h: number;
    identity?: Identity;
    style?: FrameStyle;
    finalized?: boolean;
    label?: string;
  },
  maxSide = 1024,
): Promise<HTMLCanvasElement> {
  const s = Math.min(1, maxSide / Math.max(input.w, input.h));
  await ensureFontsLoaded();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(input.w * s);
  canvas.height = Math.round(input.h * s);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  composeCardBack(
    ctx,
    canvas.width,
    canvas.height,
    input.identity,
    input.style,
    input.finalized ?? true,
    input.label,
  );
  return canvas;
}

export type RenderTeamInput = Omit<TeamComposeInput, "ctx" | "w" | "h"> & {
  size?: number;
};

/** Team frame onto a canvas element (for use as a WebGL texture). */
export async function renderTeamToCanvas(
  input: RenderTeamInput,
  maxSide = 1024,
): Promise<HTMLCanvasElement> {
  const side = Math.min(input.size ?? 1200, maxSide);
  await ensureFontsLoaded();
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  composeTeam({ ...input, ctx, w: side, h: side });
  return canvas;
}

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
