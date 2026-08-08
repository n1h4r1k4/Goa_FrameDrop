"use client";

import { COLORS } from "@/lib/brand";
import { RefreshIcon } from "./icons";

type Props = {
  scale: number;
  onScale: (n: number) => void;
  onReset: () => void;
  onChangePhoto: () => void;
  name: string;
  handle: string;
  onName: (v: string) => void;
  onHandle: (v: string) => void;
  builderClass?: string;
};

export default function FrameControls({
  scale,
  onScale,
  onReset,
  onChangePhoto,
  name,
  handle,
  onName,
  onHandle,
  builderClass,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      {/* zoom */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-cream/60">
          Zoom
        </span>
        <input
          type="range"
          min={1}
          max={5}
          step={0.01}
          value={scale}
          onChange={(e) => onScale(parseFloat(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-cream/20"
          style={{ accentColor: COLORS.sun1 }}
          aria-label="Zoom the photo"
        />
        <button
          type="button"
          onClick={onReset}
          className="font-mono text-xs uppercase tracking-widest text-sun-1 hover:underline"
        >
          Reset
        </button>
      </div>

      {/* optional identity */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Your name (required)"
          required
          aria-required="true"
          maxLength={24}
          className={`rounded-xl border bg-goa-green-deep/40 px-4 py-2.5 font-mono text-sm text-cream placeholder:text-cream/40 focus:outline-none ${
            name.trim()
              ? "border-cream/20 focus:border-sun-1"
              : "border-goa-red/50 focus:border-goa-red"
          }`}
        />
        <input
          value={handle}
          onChange={(e) => onHandle(e.target.value)}
          placeholder="@handle (optional)"
          maxLength={20}
          className="rounded-xl border border-cream/20 bg-goa-green-deep/40 px-4 py-2.5 font-mono text-sm text-cream placeholder:text-cream/40 focus:border-sun-1 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between">
        {builderClass ? (
          <span className="font-mono text-xs text-cream/70">
            class: <span className="text-sun-1">// {builderClass.toUpperCase()}</span>
          </span>
        ) : (
          <span className="font-mono text-xs text-goa-red/90">
            your name is required
          </span>
        )}
        <button
          type="button"
          onClick={onChangePhoto}
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-cream/70 hover:text-sun-1"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Change photo
        </button>
      </div>
    </div>
  );
}
