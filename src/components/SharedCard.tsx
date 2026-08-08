"use client";

import { useEffect, useState } from "react";
import { FlipIcon } from "./icons";

type Props = { front: string; back: string | null };

const face =
  "absolute inset-0 h-full w-full rounded-xl border-[3px] border-ink object-contain shadow-[7px_7px_0_var(--color-ink)]";

/**
 * The shared pass, flippable to its QR side. The back is probed rather than
 * assumed: shares made before the flip existed have no -back image, and those
 * links should still render, just without the button.
 */
export default function SharedCard({ front, back }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [hasBack, setHasBack] = useState(false);
  const [ratio, setRatio] = useState("2 / 3");

  useEffect(() => {
    if (!back) return;
    const probe = new Image();
    probe.onload = () => setHasBack(true);
    probe.src = back;
    return () => {
      probe.onload = null;
    };
  }, [back]);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-[440px]" style={{ perspective: 1800 }}>
        <div
          className="hh-flip relative w-full"
          data-flipped={flipped || undefined}
          style={{ aspectRatio: ratio }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={front}
            alt="HH Goa 2026 pass"
            className={face}
            style={{ backfaceVisibility: "hidden" }}
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (w && h) setRatio(`${w} / ${h}`);
            }}
          />
          {hasBack && back && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={back}
              alt="The back of the pass — scannable QR"
              aria-hidden={!flipped}
              className={face}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            />
          )}
        </div>
      </div>

      {hasBack && (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="hh-btn hh-btn-paper"
        >
          <FlipIcon className="h-4 w-4" />
          {flipped ? "Show the front" : "Flip to the QR"}
        </button>
      )}
    </div>
  );
}
