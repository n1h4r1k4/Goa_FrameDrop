"use client";

import { useCallback, useEffect, useRef } from "react";
import { compose, type Identity } from "@/lib/canvas/compose";
import {
  clamp,
  panToOffsetDelta,
  type Placement,
  type PhotoSize,
} from "@/lib/canvas/transform";
import { PREVIEW_SIZE } from "@/lib/canvas/constants";
import { ensureFontsLoaded } from "@/lib/canvas/fonts";
import type { FrameStyle } from "@/lib/canvas/styles";

type Props = {
  photo: CanvasImageSource;
  photoSize: PhotoSize;
  placement: Placement;
  identity?: Identity;
  style?: FrameStyle;
  onPlacementChange: (p: Placement) => void;
};

const MAX_ZOOM = 5;

export default function FrameCanvas({
  photo,
  photoSize,
  placement,
  identity,
  style,
  onPlacementChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placementRef = useRef(placement);
  placementRef.current = placement;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const side = Math.round(PREVIEW_SIZE * dpr);
    if (canvas.width !== side) {
      canvas.width = side;
      canvas.height = side;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    compose({
      ctx,
      side,
      photo,
      photoSize,
      placement: placementRef.current,
      identity,
      style,
    });
  }, [photo, photoSize, identity, style]);

  // redraw once fonts are ready, and whenever inputs change
  useEffect(() => {
    ensureFontsLoaded().then(draw);
  }, [draw]);
  useEffect(() => {
    draw();
  }, [placement, draw]);

  // pointer pan + pinch/wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let lastDist = 0;

    const cssSide = () => canvas.getBoundingClientRect().width || PREVIEW_SIZE;

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
        const { dOffsetX, dOffsetY } = panToOffsetDelta(
          cssSide(),
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
      const factor = e.deltaY < 0 ? 1.06 : 0.94;
      onPlacementChange({ ...p, scale: clamp(p.scale * factor, 1, MAX_ZOOM) });
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
  }, [photoSize, onPlacementChange]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Your HH Goa 2026 frame preview — drag to reposition, pinch or scroll to zoom"
      className="canvas-surface settle aspect-square w-full max-w-[360px] cursor-grab touch-none rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] active:cursor-grabbing"
    />
  );
}
