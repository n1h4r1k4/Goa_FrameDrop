"use client";

import { useCallback, useMemo, useRef, useState, type ComponentType } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Uploader from "./Uploader";
import FrameCanvas from "./FrameCanvas";
import FrameControls from "./FrameControls";
import ResultActions from "./ResultActions";
import TeamMode from "./TeamMode";
import Card3DView from "./Card3DView";
import { Panel, PanelHead, SectionTitle, Tape } from "./ui/Panel";
import {
  BannerIcon,
  CameraIcon,
  CircleFrameIcon,
  CrewIcon,
  TicketIcon,
} from "./icons";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/canvas/transform";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Identity } from "@/lib/canvas/compose";
import { FRAME_STYLES, STYLE, type FrameStyle } from "@/lib/canvas/styles";
import { SHAPE, type FrameShape } from "@/lib/canvas/shapes";
import { builderClass } from "@/lib/badge";

type Tab = "builderid" | "profile" | "banner" | "team";

const MODES: {
  id: Tab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "builderid", label: "Builder pass", Icon: TicketIcon },
  { id: "profile", label: "PFP overlay", Icon: CircleFrameIcon },
  { id: "banner", label: "Banner", Icon: BannerIcon },
  { id: "team", label: "Crew pass", Icon: CrewIcon },
];

// per-tab template variants
const VARIANTS: Record<Tab, [FrameShape, string][]> = {
  builderid: [
    ["ticket", "Ticket"],
    ["tall", "Badge"],
    ["arch", "Arch"],
  ],
  profile: [
    ["square", "Square"],
    ["circle", "Circle"],
  ],
  banner: [],
  team: [],
};

// a swatch colour per style for the theme tiles
const STYLE_DOT: Record<FrameStyle, string> = {
  sunset: "#fee101",
  midnight: "#06231c",
  palm: "#0c7a45",
};

// tiny press pop for the compact controls
const pop = (el: EventTarget | null) => {
  if (el instanceof HTMLElement) {
    gsap.fromTo(
      el,
      { scale: 0.9 },
      { scale: 1, duration: 0.35, ease: "back.out(3)" },
    );
  }
};

export default function Generator() {
  const [tab, setTab] = useState<Tab>("builderid");
  const [profileShape, setProfileShape] =
    useState<Extract<FrameShape, "square" | "circle">>("square");
  const [builderidShape, setBuilderidShape] =
    useState<Extract<FrameShape, "ticket" | "tall" | "arch">>("ticket");

  const [photo, setPhoto] = useState<DecodedPhoto | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [style, setStyle] = useState<FrameStyle>("sunset");
  const [name, setName] = useState("");
  // only scold about the empty name once they've actually been in the field
  const [nameTouched, setNameTouched] = useState(false);
  const [handle, setHandle] = useState("");
  const [view, setView] = useState<"edit" | "3d">("edit");
  const [generated, setGenerated] = useState(false);

  const shape: FrameShape =
    tab === "profile"
      ? profileShape
      : tab === "banner"
        ? "landscape"
        : builderidShape;
  const needsGenerate = shape === "ticket";
  const finalized = needsGenerate ? generated : true;
  const hasName = name.trim().length > 0;
  const nameMissing = nameTouched && !hasName;

  const variants = VARIANTS[tab];
  const currentVariant = tab === "profile" ? profileShape : builderidShape;
  const setVariant = (v: FrameShape) => {
    if (tab === "profile") setProfileShape(v as "square" | "circle");
    else if (tab === "builderid") {
      setBuilderidShape(v as "ticket" | "tall" | "arch");
      setGenerated(false);
    }
  };

  const identity = useMemo<Identity>(
    () => ({
      name: name.trim() || undefined,
      handle: handle.trim() || undefined,
      builderClass: name.trim() ? builderClass(name) : undefined,
    }),
    [name, handle],
  );

  const onPhoto = useCallback((p: DecodedPhoto) => {
    setPhoto(p);
    setPlacement(DEFAULT_PLACEMENT);
    setGenerated(false);
  }, []);

  // GSAP reveal + stagger when the preview appears / template changes
  const soloRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!photo) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".reveal", {
          y: 16,
          autoAlpha: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.06,
        });
      });
      return () => mm.revert();
    },
    { scope: soloRef, dependencies: [photo, shape] },
  );

  const cfg = SHAPE[shape];

  return (
    <section id="generator" className="scroll-mt-4 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        {/* what am I making? */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                setTab(id);
                setGenerated(false);
                pop(e.currentTarget);
              }}
              aria-pressed={tab === id}
              className="hh-mode"
            >
              <span className="hh-pin" aria-hidden />
              <Icon className="h-5 w-5" />
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.1em] sm:text-sm">
                {label}
              </span>
            </button>
          ))}
        </div>

        {tab === "team" ? (
          <div className="mt-8">
            <TeamMode />
          </div>
        ) : (
          <div
            ref={soloRef}
            className="mt-8 grid items-start gap-6 lg:grid-cols-2 lg:gap-8"
          >
            {/* ------------------------------------------------ controls */}
            <Panel>
              <PanelHead
                step={1}
                title="Builder photo"
                badge={photo ? "Drag to crop" : "Start here"}
              />
              <div className="px-5 py-5 sm:px-6">
                {!photo ? (
                  <Uploader onPhoto={onPhoto} />
                ) : (
                  <FrameControls
                    scale={placement.scale}
                    onScale={(s) => setPlacement((p) => ({ ...p, scale: s }))}
                    onCenter={() =>
                      setPlacement((p) => ({ ...p, offsetX: 0, offsetY: 0 }))
                    }
                    onReset={() => setPlacement(DEFAULT_PLACEMENT)}
                    onChangePhoto={() => setPhoto(null)}
                  />
                )}
              </div>

              <Tape />

              <div className="px-5 py-5 sm:px-6">
                <SectionTitle step={2} title="Builder profile" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="hh-label mb-1.5 block text-ink/70">
                      Full name / alias
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setNameTouched(true)}
                      placeholder="Your name"
                      required
                      aria-required="true"
                      maxLength={24}
                      className={`hh-input ${nameMissing ? "shadow-[3px_3px_0_var(--color-goa-red)]" : ""}`}
                    />
                  </label>
                  <label className="block">
                    <span className="hh-label mb-1.5 block text-ink/70">
                      X handle{" "}
                      <span className="text-ink/40">(optional)</span>
                    </span>
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="@handle"
                      maxLength={20}
                      className="hh-input"
                    />
                  </label>
                </div>
                <p className="mt-3 font-mono text-[0.7rem] text-ink/60">
                  {identity.builderClass ? (
                    <>
                      Builder class{" "}
                      <span className="font-bold text-goa-green">
                        {identity.builderClass.toUpperCase()}
                      </span>{" "}
                      — assigned from your name.
                    </>
                  ) : nameMissing ? (
                    <span className="text-goa-red">
                      Your name is needed before the pass can be issued.
                    </span>
                  ) : (
                    "Your name goes on the pass, and sets your builder class."
                  )}
                </p>
              </div>

              <Tape />

              <div className="px-5 py-5 sm:px-6">
                <SectionTitle step={3} title="Template & theme" />
                {variants.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2.5">
                    {variants.map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={(e) => {
                          setVariant(v);
                          pop(e.currentTarget);
                        }}
                        aria-pressed={currentVariant === v}
                        className="hh-tile"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
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

            {/* ------------------------------------------------- preview */}
            <Panel className="lg:sticky lg:top-4">
              <PanelHead
                title="Pass preview"
                right={
                  <div className="flex shrink-0 gap-1.5">
                    {(["edit", "3d"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        aria-pressed={view === v}
                        className="hh-tile px-2.5 py-1.5"
                      >
                        {v === "edit" ? "2D" : "3D"}
                      </button>
                    ))}
                  </div>
                }
              />

              <div className="flex flex-col items-center gap-4 px-5 py-6 sm:px-6">
                <div className="reveal flex w-full flex-col items-center">
                  {!photo ? (
                    <div
                      className="flex w-full max-w-[380px] flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-goa-green/40 bg-goa-green/10 px-6 text-center"
                      style={{ aspectRatio: `${cfg.w} / ${cfg.h}` }}
                    >
                      <CameraIcon className="h-8 w-8 text-goa-green/55" />
                      <span className="hh-h text-[1.25rem] text-goa-green/85">
                        Your pass lands here
                      </span>
                      <span className="font-mono text-[0.68rem] leading-relaxed text-ink/50">
                        Upload a photo on the left — it renders live, in your
                        browser.
                      </span>
                    </div>
                  ) : view === "edit" ? (
                    <FrameCanvas
                      photo={photo.bitmap}
                      photoSize={photo.size}
                      placement={placement}
                      identity={identity}
                      style={style}
                      shape={shape}
                      finalized={finalized}
                      onPlacementChange={setPlacement}
                    />
                  ) : (
                    <Card3DView
                      photo={photo}
                      placement={placement}
                      identity={identity}
                      style={style}
                      shape={shape}
                      finalized={finalized}
                    />
                  )}
                </div>

                {photo && view === "edit" && (
                  <p className="reveal font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink/45">
                    Drag to reposition · scroll or pinch to zoom
                  </p>
                )}

                <div className="reveal w-full">
                  {!photo ? (
                    <button type="button" disabled className="hh-btn hh-btn-paper w-full">
                      Upload a photo to start
                    </button>
                  ) : !hasName ? (
                    <button type="button" disabled className="hh-btn hh-btn-paper w-full">
                      Enter your name to continue
                    </button>
                  ) : needsGenerate && !generated ? (
                    <button
                      type="button"
                      onClick={() => setGenerated(true)}
                      className="hh-btn hh-btn-sun w-full py-4 text-sm"
                    >
                      Generate my pass
                    </button>
                  ) : (
                    <ResultActions
                      photo={photo}
                      placement={placement}
                      identity={identity}
                      style={style}
                      shape={shape}
                      finalized={finalized}
                    />
                  )}
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </section>
  );
}
