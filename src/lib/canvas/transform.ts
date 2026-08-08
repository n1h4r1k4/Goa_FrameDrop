/**
 * Normalized pan/zoom transform — the SAME math drives the small preview and the
 * export (WYSIWYG). Generalized to an arbitrary photo "window" so different frame
 * shapes (square, circle, tall, arch, landscape) can crop into different regions.
 * See frame-generator skill.
 */

export type Placement = { scale: number; offsetX: number; offsetY: number };
export type PhotoSize = { width: number; height: number };
export type Rect = { x: number; y: number; w: number; h: number };

export const DEFAULT_PLACEMENT: Placement = { scale: 1, offsetX: 0, offsetY: 0 };

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Where to draw the photo so it COVERS a window rect (wx,wy,ww,wh), honoring pan/zoom.
 * offsetX/Y normalized in [-1,1]; scale >= 1 zooms in.
 */
export function coverRectIn(
  wx: number,
  wy: number,
  ww: number,
  wh: number,
  photo: PhotoSize,
  placement: Placement,
): Rect {
  const { width: pw, height: ph } = photo;
  const userScale = Math.max(1, placement.scale);
  const baseScale = Math.max(ww / pw, wh / ph); // cover
  const drawScale = baseScale * userScale;
  const w = pw * drawScale;
  const h = ph * drawScale;
  const maxPanX = (w - ww) / 2;
  const maxPanY = (h - wh) / 2;
  const ox = clamp(placement.offsetX, -1, 1);
  const oy = clamp(placement.offsetY, -1, 1);
  return {
    x: wx + maxPanX * (ox - 1),
    y: wy + maxPanY * (oy - 1),
    w,
    h,
  };
}

/** Cover a square of `side` px (full-bleed). */
export const coverRect = (side: number, photo: PhotoSize, placement: Placement) =>
  coverRectIn(0, 0, side, side, photo, placement);

/** Convert a drag in display px into a normalized offset delta for a window of winW×winH. */
export function panToOffsetDelta(
  winW: number,
  winH: number,
  photo: PhotoSize,
  placement: Placement,
  dxPx: number,
  dyPx: number,
) {
  const { width: pw, height: ph } = photo;
  const drawScale = Math.max(winW / pw, winH / ph) * Math.max(1, placement.scale);
  const maxPanX = (pw * drawScale - winW) / 2;
  const maxPanY = (ph * drawScale - winH) / 2;
  return {
    dOffsetX: maxPanX > 0 ? dxPx / maxPanX : 0,
    dOffsetY: maxPanY > 0 ? dyPx / maxPanY : 0,
  };
}
