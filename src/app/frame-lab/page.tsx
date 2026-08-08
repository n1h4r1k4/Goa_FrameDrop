"use client";

// TEMP dev route for iterating on the frame composition headlessly. Remove before ship.
import { useEffect, useMemo, useState } from "react";
import FrameCanvas from "@/components/FrameCanvas";
import { renderToBlob } from "@/lib/canvas/export";
import {
  DEFAULT_PLACEMENT,
  type Placement,
  type PhotoSize,
} from "@/lib/canvas/transform";
import type { Identity } from "@/lib/canvas/compose";

function makeSyntheticPhoto(w: number, h: number): Promise<ImageBitmap> {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1e3a8a");
  g.addColorStop(1, "#9333ea");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += w / 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += h / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, Math.min(w, h) / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.font = `bold ${w * 0.06}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("FACE", w / 2, h * 0.44);
  return createImageBitmap(c);
}

export default function FrameLab() {
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [size] = useState<PhotoSize>({ width: 900, height: 1200 });
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [png, setPng] = useState<string | null>(null);
  const identity = useMemo<Identity>(
    () => ({ name: "Riolu", handle: "@geekyriolu", builderClass: "Shader Alchemist" }),
    [],
  );

  useEffect(() => {
    makeSyntheticPhoto(size.width, size.height).then(setBmp);
  }, [size]);

  useEffect(() => {
    if (!bmp) return;
    let url: string | null = null;
    renderToBlob({ photo: bmp, photoSize: size, placement, identity }).then((b) => {
      url = URL.createObjectURL(b);
      setPng(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [bmp, size, placement, identity]);

  if (!bmp) return <p className="p-8 font-mono">loading…</p>;

  return (
    <main className="flex flex-wrap items-start gap-8 p-8">
      <div>
        <p className="mb-2 font-mono text-xs text-cream/70">interactive preview</p>
        <FrameCanvas
          photo={bmp}
          photoSize={size}
          placement={placement}
          identity={identity}
          onPlacementChange={setPlacement}
        />
      </div>
      <div>
        <p className="mb-2 font-mono text-xs text-cream/70">exported PNG (real output)</p>
        {png && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt="export" width={360} height={360} className="rounded-2xl" />
        )}
      </div>
    </main>
  );
}
