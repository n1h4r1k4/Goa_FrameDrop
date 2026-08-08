"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  decodePhoto,
  DecodeError,
  ACCEPT,
  type DecodedPhoto,
} from "@/lib/heic/decode";
import { composeTeam, composeCardBack } from "@/lib/canvas/compose";
import {
  renderTeamToBlob,
  renderCardBackToBlob,
  downloadBlob,
} from "@/lib/canvas/export";
import { ensureFontsLoaded } from "@/lib/canvas/fonts";
import { shareImageFile } from "@/lib/share/webshare";
import { tweetUrl } from "@/lib/share/intent";
import { uploadFrame } from "@/lib/blob/client";
import { FRAME_STYLES, STYLE, type FrameStyle } from "@/lib/canvas/styles";
import { SHARE } from "@/lib/brand";
import CameraCapture from "./CameraCapture";
import { Panel, PanelHead, SectionTitle, Tape } from "./ui/Panel";
import {
  CrewIcon,
  DownloadIcon,
  FlipIcon,
  ShareIcon,
  UploadIcon,
} from "./icons";

const MAX = 4;
const PREVIEW = 360;
const CAPTION = "Our crew is locked in for HH Goa 2026. #FrameInGoa";

// swatch colour per theme for the compact tile picker (matches the solo flow)
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
      { scale: 0.9 },
      { scale: 1, duration: 0.35, ease: "back.out(3)" },
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
      <canvas
        ref={ref}
        width={72}
        height={72}
        className="rounded-lg border-2 border-ink"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-pink-hot text-xs font-bold text-white transition-transform active:scale-90"
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
  const [flipped, setFlipped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [names, setNames] = useState("");

  // the crew reuses the builder card back: crew name where the name goes, the
  // roster where the builder class goes
  const crewIdentity = useMemo(() => {
    const roster = names
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      name: teamName.trim() || "CREW",
      builderClass: roster.length
        ? roster.join(" · ")
        : `${photos.length} builder${photos.length === 1 ? "" : "s"}`,
    };
  }, [teamName, names, photos.length]);

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

  // the QR side
  useEffect(() => {
    const canvas = backRef.current;
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
      composeCardBack(ctx, side, side, crewIdentity, style, true, "CREW PASS"),
    );
  }, [photos.length, style, crewIdentity]);

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

  // the flip drives the whole card: preview, download and share
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(card, {
      rotateY: flipped ? 180 : 0,
      duration: reduce ? 0 : 0.85,
      ease: "power3.inOut",
    });
  }, [flipped, hasPhotos]);

  const fileName = `hh-goa-team${flipped ? "-back" : ""}.png`;
  const build = () =>
    flipped
      ? renderCardBackToBlob({
          w: 1200,
          h: 1200,
          identity: crewIdentity,
          style,
          label: "CREW PASS",
        })
      : renderTeamToBlob({ members: members(), style, teamName });

  const onDownload = async () => {
    setBusy("download");
    setNote(null);
    try {
      downloadBlob(await build(), fileName);
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
      const res = await shareImageFile(blob, CAPTION, fileName);
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
          downloadBlob(blob, fileName);
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

  return (
    <div
      ref={rootRef}
      className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8"
    >
      {/* -------------------------------------------------------- controls */}
      <Panel>
        <PanelHead
          step={1}
          title="Crew photos"
          badge={mode === "group" ? "One shot" : `${photos.length} / ${MAX}`}
        />
        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                setMode("individual");
                pop(e.currentTarget);
              }}
              aria-pressed={mode === "individual"}
              className="hh-tile justify-center"
            >
              Individual
            </button>
            <button
              type="button"
              onClick={(e) => {
                setMode("group");
                setPhotos((p) => p.slice(0, 1));
                pop(e.currentTarget);
              }}
              aria-pressed={mode === "group"}
              className="hh-tile justify-center"
            >
              Group photo
            </button>
          </div>

          {photos.length === 0 ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                disabled={busy === "add"}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-[3px] border-dashed border-ink/45 bg-paper-2 px-6 py-10 text-center transition-colors hover:border-ink"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-ink bg-sun-1 shadow-[3px_3px_0_var(--color-ink)] ${
                    busy === "add" ? "animate-pulse" : ""
                  }`}
                >
                  <UploadIcon className="h-5 w-5 text-ink" />
                </span>
                <span className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink">
                  {busy === "add"
                    ? "Reading photos…"
                    : mode === "group"
                      ? "Add your group photo"
                      : "Add crew photos"}
                </span>
                <span className="font-mono text-[0.7rem] text-ink/55">
                  {mode === "group"
                    ? "One group shot · JPG / PNG / HEIC"
                    : `Up to ${MAX} · JPG / PNG / HEIC`}
                </span>
              </button>
              <CameraCapture
                onCapture={(f) => addFiles([f])}
                label="Take a photo"
                className="hh-btn hh-btn-paper w-full"
              />
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
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
                  className="crew-thumb flex h-[72px] w-[72px] items-center justify-center rounded-lg border-2 border-dashed border-ink/50 text-2xl text-ink/60 transition-colors hover:border-ink hover:text-ink active:scale-90"
                  aria-label="Add another photo"
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>

        <Tape />

        <div className="px-5 py-5 sm:px-6">
          <SectionTitle step={2} title="Crew profile" />
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="hh-label mb-1.5 block text-ink/70">
                Crew name <span className="text-ink/40">(optional)</span>
              </span>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Codeville"
                maxLength={22}
                className="hh-input"
              />
            </label>
            {mode === "individual" && (
              <label className="block">
                <span className="hh-label mb-1.5 block text-ink/70">
                  Member names
                </span>
                <input
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  placeholder="Rishabh, Niharika"
                  className="hh-input"
                />
                <span className="mt-1.5 block font-mono text-[0.66rem] text-ink/50">
                  Comma-separated, in photo order.
                </span>
              </label>
            )}
          </div>
        </div>

        <Tape />

        <div className="px-5 py-5 sm:px-6">
          <SectionTitle step={3} title="Theme" />
          <div className="flex flex-wrap gap-2.5">
            {FRAME_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  setStyle(s);
                  pop(e.currentTarget);
                }}
                aria-pressed={s === style}
                className="hh-tile"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 rounded-full border-2 border-ink"
                  style={{ background: STYLE_DOT[s] }}
                />
                {STYLE[s].label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* --------------------------------------------------------- preview */}
      <Panel className="lg:sticky lg:top-4">
        <PanelHead title="Crew preview" />
        <div className="flex flex-col items-center gap-4 px-5 py-6 sm:px-6">
          {photos.length === 0 ? (
            <div className="flex aspect-square w-full max-w-[360px] flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-goa-green/40 bg-goa-green/10 px-6 text-center">
              <CrewIcon className="h-8 w-8 text-goa-green/55" />
              <span className="hh-h text-[1.25rem] text-goa-green/85">
                Your crew pass lands here
              </span>
              <span className="font-mono text-[0.68rem] leading-relaxed text-ink/50">
                Add up to {MAX} photos on the left.
              </span>
            </div>
          ) : (
            <>
              <div
                className="crew-reveal w-full max-w-[360px]"
                style={{ perspective: 1800 }}
              >
                <div
                  ref={cardRef}
                  className="relative aspect-square w-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <canvas
                    ref={canvasRef}
                    aria-label="Crew pass preview"
                    className="canvas-surface absolute inset-0 h-full w-full rounded-xl border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)]"
                    style={{ backfaceVisibility: "hidden" }}
                  />
                  <canvas
                    ref={backRef}
                    aria-label="The back of your crew pass — scannable QR"
                    aria-hidden={!flipped}
                    className="canvas-surface absolute inset-0 h-full w-full rounded-xl border-[3px] border-ink shadow-[6px_6px_0_var(--color-ink)]"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="crew-reveal hh-btn hh-btn-paper"
              >
                <FlipIcon className="h-4 w-4" />
                {flipped ? "Show the front" : "Flip to the QR"}
              </button>
            </>
          )}

          <div className="crew-reveal flex w-full flex-col gap-3">
            {photos.length === 0 ? (
              <button type="button" disabled className="hh-btn hh-btn-paper w-full">
                Add a photo to start
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={busy !== null}
                  className="hh-btn hh-btn-sun w-full py-4 text-sm"
                >
                  {busy === "download" ? (
                    "Rendering…"
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4" />
                      Download PNG
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  disabled={busy !== null}
                  className="hh-btn hh-btn-pink w-full py-4 text-sm"
                >
                  {busy === "share" ? (
                    "Preparing…"
                  ) : (
                    <>
                      <ShareIcon className="h-4 w-4" />
                      Share to X · #{SHARE.hashtag}
                    </>
                  )}
                </button>
              </>
            )}
            {note && (
              <p className="rounded-lg border-2 border-ink/25 bg-paper-2 px-3 py-2 font-mono text-[0.7rem] text-ink/75">
                {note}
              </p>
            )}
          </div>
        </div>
      </Panel>

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
