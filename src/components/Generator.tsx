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
import type { FrameStyle } from "@/lib/canvas/styles";
import type { FrameShape } from "@/lib/canvas/shapes";
import { builderClass } from "@/lib/badge";

type Tab = "builderid" | "profile" | "banner" | "team";
const TABS: { id: Tab; label: string }[] = [
  { id: "builderid", label: "Builder ID" },
  { id: "profile", label: "Profile" },
  { id: "banner", label: "Banner" },
  { id: "team", label: "Team" },
];

const pill = (active: boolean) =>
  `rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
    active
      ? "bg-sun-1 text-goa-green-deep"
      : "border border-cream/25 text-cream/75 hover:border-sun-1/70"
  }`;

export default function Generator() {
  const [tab, setTab] = useState<Tab>("builderid");
  const [profileShape, setProfileShape] = useState<Extract<FrameShape, "square" | "circle">>("square");

  const [photo, setPhoto] = useState<DecodedPhoto | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [style, setStyle] = useState<FrameStyle>("sunset");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [view, setView] = useState<"edit" | "3d">("edit");
  const [generated, setGenerated] = useState(false);

  const shape: FrameShape =
    tab === "profile" ? profileShape : tab === "banner" ? "landscape" : "ticket";
  const needsGenerate = tab === "builderid";
  const finalized = needsGenerate ? generated : true;

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
      {/* tabs */}
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
            className={pill(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <TeamMode />
      ) : (
        <div className="flex flex-col items-center gap-5">
          {tab === "profile" && (
            <div className="flex gap-2">
              {(
                [
                  ["square", "Square"],
                  ["circle", "Circle"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProfileShape(v)}
                  aria-pressed={profileShape === v}
                  className={pill(profileShape === v)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {!photo ? (
            <Uploader onPhoto={onPhoto} />
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setView("edit")}
                  aria-pressed={view === "edit"}
                  className={pill(view === "edit")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setView("3d")}
                  aria-pressed={view === "3d"}
                  className={pill(view === "3d")}
                >
                  3D Card
                </button>
              </div>
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
              <FrameControls
                scale={placement.scale}
                onScale={(s) => setPlacement((p) => ({ ...p, scale: s }))}
                onReset={() => setPlacement(DEFAULT_PLACEMENT)}
                onChangePhoto={() => setPhoto(null)}
                style={style}
                onStyle={setStyle}
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
            </>
          )}
        </div>
      )}
    </section>
  );
}
