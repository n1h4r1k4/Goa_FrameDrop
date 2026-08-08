"use client";

import { useCallback, useEffect, useRef } from "react";
import { compose, type Identity, type OverlaySpec } from "@/lib/canvas/compose";
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
  onPlacementChange: (p: Placement) => void;
};

const MAX_ZOOM = 5;

export default function FrameCanvas({
  photo,
  photoSize,
  placement,
  identity,
  style,
  shape = "square",
  overlay,
  onPlacementChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placementRef = useRef(placement);
  placementRef.current = placement;
  const cfg = SHAPE[shape];
  const hOverW = overlay ? 1 : cfg.h / cfg.w;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssW = canvas.clientWidth || 340;
    const cssH = cssW * hOverW;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
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
    });
  }, [photo, photoSize, identity, style, shape, overlay, hOverW]);

  useEffect(() => {
    ensureFontsLoaded().then(draw);
  }, [draw]);
  useEffect(() => {
    draw();
  }, [placement, draw]);

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

  return (
    <canvas
      ref={canvasRef}
      aria-label="Your HH Goa 2026 frame preview. Drag to reposition, pinch or scroll to zoom"
      className="canvas-surface settle w-full cursor-grab touch-none rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] active:cursor-grabbing"
      style={{
        aspectRatio: overlay ? "1 / 1" : `${cfg.w} / ${cfg.h}`,
        maxWidth: !overlay && cfg.mode === "badge" ? 320 : !overlay && cfg.h === 630 ? 460 : 360,
      }}
    />
  );
}
