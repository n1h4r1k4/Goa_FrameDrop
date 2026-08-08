"use client";

import { useCallback, useMemo, useState } from "react";
import Uploader from "./Uploader";
import FrameCanvas from "./FrameCanvas";
import FrameControls from "./FrameControls";
import ResultActions from "./ResultActions";
import TeamMode from "./TeamMode";
import Card3DView from "./Card3DView";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/canvas/transform";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Identity } from "@/lib/canvas/compose";
import { FRAME_STYLES, STYLE, type FrameStyle } from "@/lib/canvas/styles";
import type { FrameShape } from "@/lib/canvas/shapes";
import { builderClass } from "@/lib/badge";

type Tab = "builderid" | "profile" | "banner" | "team";
const TABS: { id: Tab; label: string }[] = [
  { id: "builderid", label: "Builder ID" },
  { id: "profile", label: "Profile" },
  { id: "banner", label: "Banner" },
  { id: "team", label: "Team" },
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

// a swatch colour per style for the compact dot picker
const STYLE_DOT: Record<FrameStyle, string> = {
  sunset: "#fee101",
  midnight: "#06231c",
  palm: "#0c7a45",
};

const tab_pill = (active: boolean) =>
  `rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
    active
      ? "bg-sun-1 text-goa-green-deep"
      : "border border-cream/25 text-cream/75 hover:border-sun-1/70"
  }`;

const chip = (active: boolean) =>
  `rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
    active
      ? "bg-sun-1 text-goa-green-deep"
      : "border border-cream/25 text-cream/70 hover:border-sun-1/70"
  }`;

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

  return (
    <section className="mx-auto mt-8 w-full max-w-md">
      {/* primary nav */}
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setGenerated(false);
            }}
            aria-pressed={tab === t.id}
            className={tab_pill(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <TeamMode />
      ) : !photo ? (
        <div className="flex flex-col items-center">
          <Uploader onPhoto={onPhoto} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {view === "edit" ? (
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

          {/* one compact toolbar: template · theme · 2D/3D */}
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            {variants.length > 0 ? (
              <div className="flex gap-1.5">
                {variants.map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    aria-pressed={currentVariant === v}
                    className={chip(currentVariant === v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {FRAME_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    aria-pressed={s === style}
                    title={STYLE[s].label}
                    aria-label={`${STYLE[s].label} theme`}
                    className={`h-6 w-6 rounded-full transition ${
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
              <div className="flex rounded-full border border-cream/25 p-0.5 font-mono text-[11px] uppercase tracking-widest">
                <button
                  type="button"
                  onClick={() => setView("edit")}
                  aria-pressed={view === "edit"}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    view === "edit"
                      ? "bg-sun-1 text-goa-green-deep"
                      : "text-cream/70"
                  }`}
                >
                  2D
                </button>
                <button
                  type="button"
                  onClick={() => setView("3d")}
                  aria-pressed={view === "3d"}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    view === "3d"
                      ? "bg-sun-1 text-goa-green-deep"
                      : "text-cream/70"
                  }`}
                >
                  3D
                </button>
              </div>
            </div>
          </div>

          <FrameControls
            scale={placement.scale}
            onScale={(s) => setPlacement((p) => ({ ...p, scale: s }))}
            onReset={() => setPlacement(DEFAULT_PLACEMENT)}
            onChangePhoto={() => setPhoto(null)}
            name={name}
            handle={handle}
            onName={setName}
            onHandle={setHandle}
            builderClass={identity.builderClass}
          />

          {needsGenerate && !generated ? (
            <button
              type="button"
              onClick={() => setGenerated(true)}
              className="w-full rounded-full bg-sun-1 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-goa-green-deep transition-transform active:scale-95"
            >
              Generate
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
      )}
    </section>
  );
}
