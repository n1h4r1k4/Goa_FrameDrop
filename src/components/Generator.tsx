"use client";

import { useCallback, useMemo, useState } from "react";
import Uploader from "./Uploader";
import FrameCanvas from "./FrameCanvas";
import FrameControls from "./FrameControls";
import ResultActions from "./ResultActions";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/canvas/transform";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Identity } from "@/lib/canvas/compose";
import type { FrameStyle } from "@/lib/canvas/styles";
import { builderClass } from "@/lib/badge";

export default function Generator() {
  const [photo, setPhoto] = useState<DecodedPhoto | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [style, setStyle] = useState<FrameStyle>("sunset");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

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

  return (
    <section className="mx-auto mt-10 w-full max-w-md">
      {!photo ? (
        <Uploader onPhoto={onPhoto} />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <FrameCanvas
            photo={photo.bitmap}
            photoSize={photo.size}
            placement={placement}
            identity={identity}
            style={style}
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
          />
        </div>
      )}
    </section>
  );
}
