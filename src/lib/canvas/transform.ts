/**
 * Normalized pan/zoom transform — the SAME math drives the small preview and the
 * 2× export, so what you see is what you download (WYSIWYG). See frame-generator skill.
 */

export type Placement = { scale: number; offsetX: number; offsetY: number };
export type PhotoSize = { width: number; height: number };
export type Rect = { x: number; y: number; w: number; h: number };

export const DEFAULT_PLACEMENT: Placement = { scale: 1, offsetX: 0, offsetY: 0 };

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Where to draw the photo so it COVERS a square of `side` px, honoring pan/zoom.
 * offsetX/Y are normalized in [-1, 1]; scale >= 1 zooms in.
 */
export function coverRect(
  side: number,
  photo: PhotoSize,
  placement: Placement,
): Rect {
  const { width: pw, height: ph } = photo;
  const userScale = Math.max(1, placement.scale);
  const baseScale = Math.max(side / pw, side / ph); // cover
  const drawScale = baseScale * userScale;
  const w = pw * drawScale;
  const h = ph * drawScale;
  const maxPanX = (w - side) / 2;
  const maxPanY = (h - side) / 2;
  const ox = clamp(placement.offsetX, -1, 1);
  const oy = clamp(placement.offsetY, -1, 1);
  // ox=0 -> centered; ox=1 -> photo's left edge flush; ox=-1 -> right edge flush
  const x = maxPanX * (ox - 1);
  const y = maxPanY * (oy - 1);
  return { x, y, w, h };
}

/** Convert a drag in display px into a normalized offset delta (resolution-independent). */
export function panToOffsetDelta(
  side: number,
  photo: PhotoSize,
  placement: Placement,
  dxPx: number,
  dyPx: number,
) {
  const { width: pw, height: ph } = photo;
  const drawScale = Math.max(side / pw, side / ph) * Math.max(1, placement.scale);
  const maxPanX = (pw * drawScale - side) / 2;
  const maxPanY = (ph * drawScale - side) / 2;
  return {
    dOffsetX: maxPanX > 0 ? dxPx / maxPanX : 0,
    dOffsetY: maxPanY > 0 ? dyPx / maxPanY : 0,
  };
}
