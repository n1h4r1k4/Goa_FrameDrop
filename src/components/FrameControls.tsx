"use client";

import { RefreshIcon } from "./icons";

type Props = {
  scale: number;
  onScale: (n: number) => void;
  onCenter: () => void;
  onReset: () => void;
  onChangePhoto: () => void;
};

/** "Zoom & crop" — the photo-adjust block inside section 1 of the left panel. */
export default function FrameControls({
  scale,
  onScale,
  onCenter,
  onReset,
  onChangePhoto,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="hh-label text-ink/70">Zoom &amp; crop</span>
        <span className="rounded-full border-2 border-ink bg-pink-hot px-2.5 py-0.5 font-mono text-[0.66rem] font-bold text-white tabular-nums">
          {Math.round(scale * 100)}%
        </span>
      </div>

      <input
        type="range"
        min={1}
        max={5}
        step={0.01}
        value={scale}
        onChange={(e) => onScale(parseFloat(e.target.value))}
        className="hh-range"
        aria-label="Zoom the photo"
      />

      <div className="grid grid-cols-3 gap-2.5">
        <button type="button" onClick={onCenter} className="hh-btn hh-btn-paper">
          Center
        </button>
        <button type="button" onClick={onReset} className="hh-btn hh-btn-paper">
          Reset
        </button>
        <button
          type="button"
          onClick={onChangePhoto}
          className="hh-btn hh-btn-paper"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Change
        </button>
      </div>
    </div>
  );
}
