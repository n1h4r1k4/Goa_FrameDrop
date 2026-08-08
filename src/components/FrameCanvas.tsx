"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  compose,
  composeCardBack,
  type Identity,
  type OverlaySpec,
} from "@/lib/canvas/compose";
import {
  clamp,
  panToOffsetDelta,
  type Placement,
  type PhotoSize,
} from "@/lib/canvas/transform";
import { ensureFontsLoaded } from "@/lib/canvas/fonts";
import type { FrameStyle } from "@/lib/canvas/styles";
import { SHAPE, type FrameShape } from "@/lib/canvas/shapes";

type Props = {
  photo: CanvasImageSource;
  photoSize: PhotoSize;
  placement: Placement;
  identity?: Identity;
  style?: FrameStyle;
  shape?: FrameShape;
  overlay?: OverlaySpec;
  finalized?: boolean;
  /** show the QR side; the card rotates to it */
  flipped?: boolean;
  onPlacementChange: (p: Placement) => void;
};

const MAX_ZOOM = 5;

/** Size a face's backing store to its CSS box at retina, and hand back the pixels. */
function sizeFor(canvas: HTMLCanvasElement, hOverW: number) {
  const cssW = canvas.clientWidth || 340;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssW * hOverW * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h };
}

export default function FrameCanvas({
  photo,
  photoSize,
  placement,
  identity,
  style,
  shape = "square",
  overlay,
  finalized = true,
  flipped = false,
  onPlacementChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const placementRef = useRef(placement);
  placementRef.current = placement;
  const cfg = SHAPE[shape];
  const hOverW = overlay ? 1 : cfg.h / cfg.w;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = sizeFor(canvas, hOverW);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    compose({
      ctx,
      w,
      h,
      photo,
      photoSize,
      placement: placementRef.current,
      identity,
      style,
      shape,
      overlay,
      finalized,
    });
  }, [photo, photoSize, identity, style, shape, overlay, finalized, hOverW]);

  const drawBack = useCallback(() => {
    const canvas = backRef.current;
    if (!canvas) return;
    const { w, h } = sizeFor(canvas, hOverW);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    composeCardBack(ctx, w, h, identity, style, finalized);
  }, [identity, style, finalized, hOverW]);

  useEffect(() => {
    ensureFontsLoaded().then(() => {
      draw();
      drawBack();
    });
  }, [draw, drawBack]);
  useEffect(() => {
    draw();
  }, [placement, draw]);

  // the flip itself — rotate the card, not the canvases
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(card, {
      rotateY: flipped ? 180 : 0,
      duration: reduce ? 0 : 0.85,
      ease: "power3.inOut",
    });
  }, [flipped]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let lastDist = 0;

    const winSize = () => {
      const cssW = canvas.getBoundingClientRect().width || 340;
      const cssH = cssW * hOverW;
      const wf = overlay
        ? overlay.window
        : { w: cfg.window.w / cfg.w, h: cfg.window.h / cfg.h };
      return { w: wf.w * cssW, h: wf.h * cssH };
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);
      const p = placementRef.current;
      if (pointers.size === 1) {
        const win = winSize();
        const { dOffsetX, dOffsetY } = panToOffsetDelta(
          win.w,
          win.h,
          photoSize,
          p,
          cur.x - prev.x,
          cur.y - prev.y,
        );
        onPlacementChange({
          scale: p.scale,
          offsetX: clamp(p.offsetX + dOffsetX, -1, 1),
          offsetY: clamp(p.offsetY + dOffsetY, -1, 1),
        });
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastDist > 0) {
          onPlacementChange({
            ...p,
            scale: clamp(p.scale * (dist / lastDist), 1, MAX_ZOOM),
          });
        }
        lastDist = dist;
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) lastDist = 0;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = placementRef.current;
      onPlacementChange({
        ...p,
        scale: clamp(p.scale * (e.deltaY < 0 ? 1.06 : 0.94), 1, MAX_ZOOM),
      });
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [photoSize, onPlacementChange, cfg, overlay, hOverW]);

  const maxWidth = overlay
    ? 400
    : cfg.mode === "badge"
      ? 360
      : cfg.h === 630
        ? 520
        : 400;
  const face =
    "canvas-surface absolute inset-0 h-full w-full rounded-xl border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)]";

  return (
    // `settle` lives on the wrapper, not the card: it animates transform, and
    // a filled CSS animation would outrank the inline rotateY GSAP writes
    <div className="settle w-full" style={{ maxWidth, perspective: 1800 }}>
      <div
        ref={cardRef}
        className="relative w-full"
        style={{
          aspectRatio: overlay ? "1 / 1" : `${cfg.w} / ${cfg.h}`,
          transformStyle: "preserve-3d",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Your HH Goa 2026 pass. Drag to reposition, pinch or scroll to zoom"
          className={`${face} cursor-grab touch-none active:cursor-grabbing`}
          style={{
            backfaceVisibility: "hidden",
            pointerEvents: flipped ? "none" : "auto",
          }}
        />
        <canvas
          ref={backRef}
          aria-label="The back of your pass — scannable QR"
          aria-hidden={!flipped}
          className={face}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            pointerEvents: flipped ? "auto" : "none",
          }}
        />
      </div>
    </div>
  );
}
