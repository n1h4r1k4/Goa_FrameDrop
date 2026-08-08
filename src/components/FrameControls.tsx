"use client";

import { COLORS } from "@/lib/brand";
import { FRAME_STYLES, STYLE, type FrameStyle } from "@/lib/canvas/styles";

type Props = {
  scale: number;
  onScale: (n: number) => void;
  onReset: () => void;
  onChangePhoto: () => void;
  style: FrameStyle;
  onStyle: (s: FrameStyle) => void;
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
  style,
  onStyle,
  name,
  handle,
  onName,
  onHandle,
  builderClass,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      {/* style picker */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-cream/60">
          Style
        </span>
        <div className="flex flex-1 gap-2">
          {FRAME_STYLES.map((s) => {
            const active = s === style;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStyle(s)}
                aria-pressed={active}
                className={`flex-1 rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "bg-sun-1 text-goa-green-deep"
                    : "border border-cream/25 text-cream/75 hover:border-sun-1/70"
                }`}
              >
                {STYLE[s].label}
              </button>
            );
          })}
        </div>
      </div>

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
          placeholder="Name (optional)"
          maxLength={24}
          className="rounded-xl border border-cream/20 bg-goa-green-deep/40 px-4 py-2.5 font-mono text-sm text-cream placeholder:text-cream/40 focus:border-sun-1 focus:outline-none"
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
            class:{" "}
            <span className="text-sun-1">// {builderClass.toUpperCase()}</span>
          </span>
        ) : (
          <span className="font-mono text-xs text-cream/40">
            add a name for a builder class
          </span>
        )}
        <button
          type="button"
          onClick={onChangePhoto}
          className="font-mono text-xs uppercase tracking-widest text-cream/70 hover:text-sun-1"
        >
          ↺ Change photo
        </button>
      </div>
    </div>
  );
}
