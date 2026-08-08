"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  decodePhoto,
  DecodeError,
  ACCEPT,
  type DecodedPhoto,
} from "@/lib/heic/decode";
import { composeTeam } from "@/lib/canvas/compose";
import { renderTeamToBlob, downloadBlob } from "@/lib/canvas/export";
import { ensureFontsLoaded } from "@/lib/canvas/fonts";
import { shareImageFile } from "@/lib/share/webshare";
import { tweetUrl } from "@/lib/share/intent";
import { uploadFrame } from "@/lib/blob/client";
import { FRAME_STYLES, STYLE, type FrameStyle } from "@/lib/canvas/styles";
import { SHARE } from "@/lib/brand";
import CameraCapture from "./CameraCapture";

const MAX = 4;
const PREVIEW = 360;
const CAPTION = "Our crew is locked in for HH Goa 2026. #FrameInGoa";

// swatch colour per theme for the compact dot picker (matches the solo flow)
const STYLE_DOT: Record<FrameStyle, string> = {
  sunset: "#fee101",
  midnight: "#06231c",
  palm: "#0c7a45",
};

// tiny press pop used across the crew controls
const pop = (el: EventTarget | null) => {
  if (el instanceof HTMLElement) {
    gsap.fromTo(
      el,
      { scale: 0.82 },
      { scale: 1, duration: 0.4, ease: "back.out(3)" },
    );
  }
};

function Thumb({
  bmp,
  onRemove,
  className = "",
}: {
  bmp: ImageBitmap;
  onRemove: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const s = Math.max(c.width / bmp.width, c.height / bmp.height);
    const w = bmp.width * s;
    const h = bmp.height * s;
    ctx.drawImage(bmp, (c.width - w) / 2, (c.height - h) / 2, w, h);
  }, [bmp]);
  return (
    <div className={`relative ${className}`}>
      <canvas ref={ref} width={72} height={72} className="rounded-lg" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-goa-red text-xs text-cream transition-transform active:scale-90"
      >
        ×
      </button>
    </div>
  );
}

export default function TeamMode() {
  const [photos, setPhotos] = useState<DecodedPhoto[]>([]);
  const [mode, setMode] = useState<"individual" | "group">("individual");
  const [teamName, setTeamName] = useState("");
  const [style, setStyle] = useState<FrameStyle>("sunset");
  const [busy, setBusy] = useState<null | "add" | "download" | "share">(null);
  const [note, setNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [names, setNames] = useState("");
  const members = useCallback(() => {
    const list = names.split(",").map((s) => s.trim());
    return photos.map((p, i) => ({
      photo: p.bitmap,
      size: p.size,
      name: list[i] || undefined,
    }));
  }, [photos, names]);

  const addFiles = useCallback(
    async (files?: FileList | File[] | null) => {
      if (!files || !files.length) return;
      setBusy("add");
      setNote(null);
      try {
        const cap = mode === "group" ? 1 : MAX;
        const picked = Array.from(files).slice(0, cap - photos.length);
        const decoded = await Promise.all(picked.map((f) => decodePhoto(f)));
        setPhotos((prev) => [...prev, ...decoded].slice(0, cap));
      } catch (e) {
        setNote(
          e instanceof DecodeError
            ? e.message
            : "Couldn't read one of those photos.",
        );
      } finally {
        setBusy(null);
      }
    },
    [photos.length, mode],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photos.length) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const side = Math.round(PREVIEW * dpr);
    if (canvas.width !== side) {
      canvas.width = side;
      canvas.height = side;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ensureFontsLoaded().then(() =>
      composeTeam({ ctx, w: side, h: side, members: members(), style, teamName }),
    );
  }, [photos, style, teamName, names, members]);

  // GSAP reveal + stagger whenever the crew preview appears / mode flips
  const hasPhotos = photos.length > 0;
  useGSAP(
    () => {
      if (!hasPhotos) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".crew-reveal", {
          y: 16,
          autoAlpha: 0,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.07,
        });
        gsap.from(".crew-thumb", {
          scale: 0.6,
          autoAlpha: 0,
          duration: 0.35,
          ease: "back.out(1.7)",
          stagger: 0.05,
          delay: 0.12,
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [hasPhotos, mode] },
  );

  const build = () => renderTeamToBlob({ members: members(), style, teamName });

  const onDownload = async () => {
    setBusy("download");
    setNote(null);
    try {
      downloadBlob(await build(), "hh-goa-team.png");
      if (canvasRef.current)
        gsap.fromTo(
          canvasRef.current,
          { scale: 0.97 },
          { scale: 1, duration: 0.5, ease: "elastic.out(1,0.6)" },
        );
    } catch {
      setNote("Couldn't render. Try fewer or smaller photos.");
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    setBusy("share");
    setNote(null);
    try {
      const blob = await build();
      const res = await shareImageFile(blob, CAPTION, "hh-goa-team.png");
      if (res === "unsupported") {
        try {
          const { shareId } = await uploadFrame(blob);
          window.open(
            tweetUrl(`${window.location.origin}/s/${shareId}`, CAPTION),
            "_blank",
            "noopener,noreferrer",
          );
          setNote("Opened X with a preview link.");
        } catch {
          window.open(tweetUrl(undefined, CAPTION), "_blank", "noopener,noreferrer");
          downloadBlob(blob, "hh-goa-team.png");
          setNote("Opened X. Image downloaded so you can attach it.");
        }
      }
    } catch {
      setNote("Couldn't prepare the share. Try Download.");
    } finally {
      setBusy(null);
    }
  };

  const canAdd = photos.length < (mode === "group" ? 1 : MAX);
  const modeBtn = (active: boolean) =>
    `flex-1 rounded-full px-3 py-2 font-mono text-xs uppercase tracking-widest transition-all active:scale-95 ${
      active
        ? "bg-sun-1 text-goa-green-deep"
        : "border border-cream/25 text-cream/75 hover:border-sun-1/70"
    }`;

  return (
    <div ref={rootRef} className="flex flex-col items-center gap-5">
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={(e) => {
            setMode("individual");
            pop(e.currentTarget);
          }}
          aria-pressed={mode === "individual"}
          className={modeBtn(mode === "individual")}
        >
          Individual Photos
        </button>
        <button
          type="button"
          onClick={(e) => {
            setMode("group");
            setPhotos((p) => p.slice(0, 1));
            pop(e.currentTarget);
          }}
          aria-pressed={mode === "group"}
          className={modeBtn(mode === "group")}
        >
          Group Photo
        </button>
      </div>
      {photos.length === 0 ? (
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            disabled={busy === "add"}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-cream/25 bg-goa-green-deep/30 px-6 py-14 text-center transition-colors hover:border-sun-1/70"
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={`text-sun-1 ${busy === "add" ? "animate-pulse" : ""}`}
            >
              <path
                d="M12 15V3m0 0L8 7m4-4l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-mono text-sm uppercase tracking-[0.2em] text-sun-1">
              {busy === "add"
                ? "Reading photos…"
                : mode === "group"
                  ? "Add your group photo"
                  : "Add teammates' photos"}
            </span>
            <span className="font-mono text-xs text-cream/60">
              {mode === "group"
                ? "one group shot · jpg / png / heic"
                : "pick up to 4 · jpg / png / heic"}
            </span>
          </button>
          <CameraCapture
            onCapture={(f) => addFiles([f])}
            label="Take a photo"
            className="w-full rounded-full border-2 border-sun-1 px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest text-sun-1 transition-transform hover:-translate-y-0.5 active:scale-95"
          />
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            aria-label="Team frame preview"
            className="crew-reveal canvas-surface aspect-square w-full max-w-[360px] rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          />

          <div className="crew-reveal flex w-full items-center gap-3">
            <div className="flex flex-1 flex-wrap gap-2">
              {photos.map((p, i) => (
                <Thumb
                  key={i}
                  bmp={p.bitmap}
                  className="crew-thumb"
                  onRemove={() =>
                    setPhotos((prev) => prev.filter((_, j) => j !== i))
                  }
                />
              ))}
              {canAdd && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="crew-thumb flex h-[72px] w-[72px] items-center justify-center rounded-lg border border-dashed border-cream/30 text-2xl text-sun-1 transition-colors hover:border-sun-1 active:scale-90"
                  aria-label="Add another photo"
                >
                  +
                </button>
              )}
            </div>
          </div>

          {mode === "individual" && (
            <input
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Names, comma-separated (Krishna, Aisha, Dev)"
              className="crew-reveal w-full rounded-xl border border-cream/20 bg-goa-green-deep/40 px-4 py-2.5 font-mono text-sm text-cream placeholder:text-cream/40 focus:border-sun-1 focus:outline-none"
            />
          )}
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Crew name (optional)"
            maxLength={22}
            className="crew-reveal w-full rounded-xl border border-cream/20 bg-goa-green-deep/40 px-4 py-2.5 font-mono text-sm text-cream placeholder:text-cream/40 focus:border-sun-1 focus:outline-none"
          />

          {/* theme dots — same compact picker as the solo flow */}
          <div className="crew-reveal flex w-full items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-cream/60">
              Theme
            </span>
            <div className="flex items-center gap-2">
              {FRAME_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    setStyle(s);
                    pop(e.currentTarget);
                  }}
                  aria-pressed={s === style}
                  title={STYLE[s].label}
                  aria-label={`${STYLE[s].label} theme`}
                  className={`h-7 w-7 rounded-full transition ${
                    s === style
                      ? "ring-2 ring-sun-1 ring-offset-2 ring-offset-goa-green"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    background: STYLE_DOT[s],
                    border: "1px solid rgba(255,251,232,0.35)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="crew-reveal flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onDownload}
                disabled={busy !== null}
                className="flex-1 rounded-full bg-sun-1 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-goa-green-deep transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                {busy === "download" ? "Rendering…" : "↓ Download PNG"}
              </button>
              <button
                type="button"
                onClick={onShare}
                disabled={busy !== null}
                className="flex-1 rounded-full border-2 border-sun-1 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-sun-1 transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                {busy === "share" ? "Preparing…" : `Share to X · #${SHARE.hashtag}`}
              </button>
            </div>
            {note && <p className="font-mono text-xs text-cream/70">{note}</p>}
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}
