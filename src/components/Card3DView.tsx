"use client";

import { useEffect, useState } from "react";
import Card3D from "./Card3D";
import { FlipIcon } from "./icons";
import { renderToCanvas } from "@/lib/canvas/export";
import { composeCardBack } from "@/lib/canvas/compose";
import { ensureFontsLoaded } from "@/lib/canvas/fonts";
import type { Placement } from "@/lib/canvas/transform";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Identity } from "@/lib/canvas/compose";
import type { FrameStyle } from "@/lib/canvas/styles";
import type { FrameShape } from "@/lib/canvas/shapes";

type Props = {
  photo: DecodedPhoto;
  placement: Placement;
  identity: Identity;
  style: FrameStyle;
  shape: FrameShape;
  finalized?: boolean;
};

export default function Card3DView({
  photo,
  placement,
  identity,
  style,
  shape,
  finalized = true,
}: Props) {
  const [cards, setCards] = useState<{
    front: HTMLCanvasElement;
    back: HTMLCanvasElement;
  } | null>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      const front = await renderToCanvas({
        photo: photo.bitmap,
        photoSize: photo.size,
        placement,
        identity,
        style,
        shape,
        finalized,
      });
      const back = document.createElement("canvas");
      back.width = front.width;
      back.height = front.height;
      const bx = back.getContext("2d");
      if (bx) {
        await ensureFontsLoaded();
        composeCardBack(bx, back.width, back.height, identity, style, finalized);
      }
      if (alive) setCards({ front, back });
    }, 220);
    return () => {
      alive = false;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photo,
    placement.scale,
    placement.offsetX,
    placement.offsetY,
    identity.name,
    identity.handle,
    identity.builderClass,
    style,
    shape,
    finalized,
  ]);

  if (!cards) {
    return (
      <div className="h-[520px] w-full max-w-[380px] animate-pulse rounded-2xl bg-goa-green-deep/40" />
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <Card3D
        front={cards.front}
        back={cards.back}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex items-center gap-2 rounded-full border border-cream/25 px-5 py-2 font-mono text-xs uppercase tracking-widest text-cream/80 transition-colors hover:border-sun-1/70 active:scale-95"
      >
        <FlipIcon className="h-4 w-4" />
        {flipped ? "Show front" : "Flip to QR"}
      </button>
      <p className="font-mono text-[11px] text-cream/50">
        grab the card and fling it — the lanyard swings
      </p>
    </div>
  );
}
