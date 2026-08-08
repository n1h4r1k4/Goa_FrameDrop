"use client";

import { useEffect, useState } from "react";
import Uploader from "./Uploader";
import FrameCanvas from "./FrameCanvas";
import ResultActions from "./ResultActions";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/canvas/transform";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { OverlaySpec } from "@/lib/canvas/compose";
import { TEMPLATES } from "@/lib/canvas/templates";
import { COLORS } from "@/lib/brand";

function useImage(src?: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const im = new Image();
    im.onload = () => {
      if (alive) setImg(im);
    };
    im.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return img;
}

export default function TemplateMode() {
  const [photo, setPhoto] = useState<DecodedPhoto | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [idx, setIdx] = useState(0);

  const tpl = TEMPLATES[idx];
  const img = useImage(tpl.src);
  const overlay: OverlaySpec | undefined = img
    ? { img, window: tpl.window }
    : undefined;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid w-full grid-cols-4 gap-2">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            title={t.label}
            className={`overflow-hidden rounded-lg border-2 bg-goa-green-deep transition-colors ${
              i === idx ? "border-sun-1" : "border-cream/20 hover:border-sun-1/60"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.src} alt={t.label} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      {!photo ? (
        <Uploader
          onPhoto={(p) => {
            setPhoto(p);
            setPlacement(DEFAULT_PLACEMENT);
          }}
        />
      ) : (
        <>
          <FrameCanvas
            photo={photo.bitmap}
            photoSize={photo.size}
            placement={placement}
            overlay={overlay}
            onPlacementChange={setPlacement}
          />
          <div className="flex w-full items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-cream/60">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={0.01}
              value={placement.scale}
              onChange={(e) =>
                setPlacement((p) => ({ ...p, scale: parseFloat(e.target.value) }))
              }
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-cream/20"
              style={{ accentColor: COLORS.sun1 }}
              aria-label="Zoom the photo"
            />
            <button
              type="button"
              onClick={() => setPlacement(DEFAULT_PLACEMENT)}
              className="font-mono text-xs uppercase tracking-widest text-sun-1 hover:underline"
            >
              Reset
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="self-end font-mono text-xs uppercase tracking-widest text-cream/70 hover:text-sun-1"
          >
            ↺ Change photo
          </button>
          <ResultActions
            photo={photo}
            placement={placement}
            identity={{}}
            style="sunset"
            shape="square"
            overlay={overlay}
          />
        </>
      )}
    </div>
  );
}
