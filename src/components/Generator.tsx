"use client";

import { useCallback, useMemo, useState } from "react";
import Uploader from "./Uploader";
import FrameCanvas from "./FrameCanvas";
import FrameControls from "./FrameControls";
import ResultActions from "./ResultActions";
import TeamMode from "./TeamMode";
import TemplateMode from "./TemplateMode";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/canvas/transform";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Identity } from "@/lib/canvas/compose";
import type { FrameStyle } from "@/lib/canvas/styles";
import type { FrameShape } from "@/lib/canvas/shapes";
import { builderClass } from "@/lib/badge";

type Tab = "profile" | "builderid" | "banner" | "team" | "templates";
const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "builderid", label: "Builder ID" },
  { id: "banner", label: "Banner" },
  { id: "team", label: "Team" },
  { id: "templates", label: "Templates" },
];

const pill = (active: boolean) =>
  `rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
    active
      ? "bg-sun-1 text-goa-green-deep"
      : "border border-cream/25 text-cream/75 hover:border-sun-1/70"
  }`;

export default function Generator() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profileShape, setProfileShape] = useState<Extract<FrameShape, "square" | "circle">>("square");
  const [badgeShape, setBadgeShape] = useState<Extract<FrameShape, "tall" | "arch">>("tall");

  const [photo, setPhoto] = useState<DecodedPhoto | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [style, setStyle] = useState<FrameStyle>("sunset");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const shape: FrameShape =
    tab === "profile" ? profileShape : tab === "builderid" ? badgeShape : "landscape";

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
  }, []);

  const subToggle =
    tab === "profile"
      ? ([
          ["square", "Square"],
          ["circle", "Circle"],
        ] as const)
      : tab === "builderid"
        ? ([
            ["tall", "Badge"],
            ["arch", "Arch"],
          ] as const)
        : null;

  const onSub = (v: string) => {
    if (tab === "profile") setProfileShape(v as "square" | "circle");
    else if (tab === "builderid") setBadgeShape(v as "tall" | "arch");
  };

  return (
    <section className="mx-auto mt-8 w-full max-w-md">
      {/* tabs */}
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={pill(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <TeamMode />
      ) : tab === "templates" ? (
        <TemplateMode />
      ) : (
        <div className="flex flex-col items-center gap-5">
          {subToggle && (
            <div className="flex gap-2">
              {subToggle.map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onSub(v)}
                  aria-pressed={shape === v}
                  className={pill(shape === v)}
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
              <FrameCanvas
                photo={photo.bitmap}
                photoSize={photo.size}
                placement={placement}
                identity={identity}
                style={style}
                shape={shape}
                onPlacementChange={setPlacement}
              />
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
              <ResultActions
                photo={photo}
                placement={placement}
                identity={identity}
                style={style}
                shape={shape}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
