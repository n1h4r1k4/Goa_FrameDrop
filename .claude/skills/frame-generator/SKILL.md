---
name: frame-generator
description: Client-side canvas pipeline for the HH Goa PFP frame — normalized pan/zoom transform math shared by preview and export, the iOS canvas-size cap guard, 3-tier HEIC decode, compose draw-order (photo → overlay → text), fonts-ready-before-export, and deterministic builder-class badge generation. Use when building or reviewing photo upload, canvas rendering, or PNG export.
---

# HH Goa — Frame Generator (canvas)

Everything is **client-side** for near-instant output and zero upload on the download path. Format A: the uploaded photo stays front-and-center; a branded frame overlay wraps it.

## Constants (`lib/canvas/constants.ts`)
```ts
export const EXPORT_SIZE = 1200;              // logical square px (PFP)
export const MAX_CANVAS_AREA = 16_777_216;    // iOS Safari hard cap (~16.7MP)
export const MAX_CANVAS_SIDE = 4096;          // iOS per-dimension safe cap
export const TARGET_DPR = 2;                   // retina; 3x adds no visible gain + risks cap
```

## Normalized transform (`lib/canvas/transform.ts`) — WYSIWYG rule
Store the user's placement as **normalized, resolution-independent** values so the small preview and the 2× export render identically:
```ts
type Placement = { scale: number; offsetX: number; offsetY: number }; // offsets in [-1,1] of the frame box
```
- Base fit = **cover** (photo fills the square, center-cropped) at `scale = 1`.
- `scale ≥ 1` zooms in; pan moves within bounds. Clamp so the photo never reveals empty edges inside the photo window.
- One function computes the destination rect for a given canvas size + Placement; both preview and export call it. **Never** compute placement from pixel sizes directly.

## Export resolution picker (`lib/canvas/export.ts`) — iOS cap guard
```ts
function exportDims(w = EXPORT_SIZE, h = EXPORT_SIZE) {
  const byArea = Math.floor(Math.sqrt(MAX_CANVAS_AREA / (w * h)));
  const bySide = MAX_CANVAS_SIDE / Math.max(w, h);
  const scale = Math.max(1, Math.min(TARGET_DPR, byArea, bySide));
  return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
}
```
- Export via `canvas.toBlob(cb, "image/png")`. If it returns null (or a black frame on iOS), you exceeded the cap — lower `scale`.
- Set `ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"`.

## Compose draw order (`lib/canvas/compose.ts`)
Given a target canvas + `ImageBitmap` + Placement + optional identity:
1. Fill background (goa-green) — covers any transparency.
2. `drawImage(photo, destRect)` using the shared transform.
3. `drawImage(frameOverlayPng, 0,0,W,H)` — transparent-center sunset frame (the brand).
4. Text: name/handle + builder-class badge (Imbue/Victor Mono) — only if provided.
- Same function drives preview (small canvas) and export (2× canvas); pass the canvas + scale.

## HEIC + decode (`lib/heic/decode.ts`) — 3 tiers
```ts
export async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  // 1) fast path: let the browser try (Safari/modern Chrome decode HEIC natively)
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch {}
  // 2) HEIC fallback: lazy-load libheif WASM ONLY when needed (keeps initial bundle lean)
  if (await isHeicFile(file)) {
    const { heicTo } = await import("heic-to");        // dynamic import — never top-level
    const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
    return await createImageBitmap(jpeg, { imageOrientation: "from-image" });
  }
  // 3) last resort: object URL -> <img> -> bitmap
  return await bitmapViaImgTag(file);
}
```
- Accept `image/*,.heic,.heif`. Always pass `imageOrientation: "from-image"` (portrait phone shots).
- On total failure show: "Couldn't read this photo — try a JPG/PNG or a screenshot."

## Fonts before export
`await document.fonts.ready` (and ideally `document.fonts.load("700 10px 'Imbue'")` etc.) BEFORE composing the export, or canvas text falls back to a system font.

## Builder-class badge (`lib/badge.ts`)
Deterministic from name/handle so the same person always gets the same class:
```ts
const CLASSES = ["Terminal Dweller","Shader Alchemist","Latency Slayer","Protocol Pirate","Midnight Shipper","Sandbox Sovereign", /* on-brand, buildy */];
export const builderClass = (seed: string) => CLASSES[[...seed].reduce((a,c)=>a+c.charCodeAt(0),0) % CLASSES.length];
```
Optional; blank name = pure frame.

## Do / Don't
- ✅ One transform math for preview + export (WYSIWYG). ✅ Guard the iOS cap. ✅ Lazy-load HEIC WASM. ✅ `touch-action: none` on the interactive canvas.
- ❌ Don't import `heic-to` at module top level. ❌ Don't multiply display size by DPR without clamping. ❌ Don't export before fonts are ready.
- Related: **hhgoa-brand** (colors/fonts), **share-og** (what happens to the PNG next).
