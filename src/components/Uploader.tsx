"use client";

import { useCallback, useRef, useState } from "react";
import {
  decodePhoto,
  DecodeError,
  ACCEPT,
  type DecodedPhoto,
} from "@/lib/heic/decode";
import CameraCapture from "./CameraCapture";
import { UploadIcon } from "./icons";

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
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-[3px] border-dashed px-6 py-10 text-center transition-colors ${
          drag
            ? "border-pink-hot bg-sun-1/25"
            : "border-ink/45 bg-paper-2 hover:border-ink"
        }`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-sun-1 shadow-[3px_3px_0_var(--color-ink)] ${
            busy ? "animate-pulse" : ""
          }`}
        >
          <UploadIcon className="h-5 w-5 text-ink" />
        </span>
        <span className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink">
          {busy ? "Reading photo…" : "Upload photo"}
        </span>
        <span className="font-mono text-[0.7rem] text-ink/55">
          Drag &amp; drop or click to browse · JPG / PNG / HEIC
        </span>
      </button>

      <CameraCapture
        onCapture={(f) => handle(f)}
        label="Take a photo"
        className="hh-btn hh-btn-paper mt-3 w-full"
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {error && (
        <p
          className="mt-3 rounded-lg border-2 border-goa-red bg-goa-red/10 px-3 py-2 font-mono text-xs text-goa-red"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
