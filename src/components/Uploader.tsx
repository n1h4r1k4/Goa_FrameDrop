"use client";

import { useCallback, useRef, useState } from "react";
import {
  decodePhoto,
  DecodeError,
  ACCEPT,
  type DecodedPhoto,
} from "@/lib/heic/decode";

type Props = { onPhoto: (p: DecodedPhoto) => void };

export default function Uploader({ onPhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        onPhoto(await decodePhoto(file));
      } catch (e) {
        setError(
          e instanceof DecodeError
            ? e.message
            : "Something went wrong reading that photo. Try a JPG or PNG.",
        );
      } finally {
        setBusy(false);
      }
    },
    [onPhoto],
  );

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        className={`group flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          drag
            ? "border-sun-1 bg-goa-green-deep/60"
            : "border-cream/25 bg-goa-green-deep/30 hover:border-sun-1/70"
        }`}
      >
        <span className="text-4xl" aria-hidden>
          {busy ? "🌀" : "🌅"}
        </span>
        <span className="font-mono text-sm uppercase tracking-[0.2em] text-sun-1">
          {busy ? "Reading photo…" : "Upload a photo"}
        </span>
        <span className="font-mono text-xs text-cream/60">
          tap to choose · or drop it here · jpg / png / heic
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {error && (
        <p className="mt-3 font-mono text-xs text-goa-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
