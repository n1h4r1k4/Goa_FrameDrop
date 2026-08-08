"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onCapture: (file: File) => void;
  className?: string;
  label?: string;
};

/**
 * "Take photo" — live camera capture via getUserMedia, with a mobile
 * capture-input fallback when the camera API isn't available (e.g. insecure origin).
 */
export default function CameraCapture({
  onCapture,
  className = "",
  label = "Take a photo",
}: Props) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(
    async (face: "user" | "environment" = "user") => {
      setErr(null);
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        fallbackRef.current?.click();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: face },
          audio: false,
        });
        streamRef.current = stream;
        setFacing(face);
        setOpen(true);
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        });
      } catch {
        fallbackRef.current?.click();
      }
    },
    [],
  );

  const close = useCallback(() => {
    stop();
    setOpen(false);
  }, [stop]);

  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth || 720;
    const h = v.videoHeight || 960;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1); // un-mirror the selfie
    }
    ctx.drawImage(v, 0, 0, w, h);
    c.toBlob((blob) => {
      if (blob) onCapture(new File([blob], "camera.png", { type: "image/png" }));
      close();
    }, "image/png");
  }, [facing, onCapture, close]);

  const flip = useCallback(() => {
    const next = facing === "user" ? "environment" : "user";
    stop();
    start(next);
  }, [facing, start, stop]);

  return (
    <>
      <button type="button" onClick={() => start(facing)} className={className}>
        {label}
      </button>

      <input
        ref={fallbackRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onCapture(f);
        }}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-goa-green-deep/95 p-4">
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-[70vh] w-auto rounded-xl border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)]"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
          />
          {err && <p className="mt-2 font-mono text-xs text-goa-red">{err}</p>}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="hh-btn hh-btn-paper"
            >
              Cancel
            </button>
            <button type="button" onClick={flip} className="hh-btn hh-btn-paper">
              Flip
            </button>
            <button
              type="button"
              onClick={capture}
              className="hh-btn hh-btn-sun px-7"
            >
              Capture
            </button>
          </div>
        </div>
      )}
    </>
  );
}
