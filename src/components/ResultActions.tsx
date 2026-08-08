"use client";

import { useEffect, useRef, useState } from "react";
import { renderToBlob, downloadBlob } from "@/lib/canvas/export";
import { shareImageFile, canShareFiles } from "@/lib/share/webshare";
import { tweetUrl } from "@/lib/share/intent";
import { uploadFrame } from "@/lib/blob/client";
import { DownloadIcon, ShareIcon } from "./icons";
import { SHARE } from "@/lib/brand";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Placement } from "@/lib/canvas/transform";
import type { Identity, OverlaySpec } from "@/lib/canvas/compose";
import type { FrameStyle } from "@/lib/canvas/styles";
import { SHAPE, type FrameShape } from "@/lib/canvas/shapes";

type Props = {
  photo: DecodedPhoto;
  placement: Placement;
  identity: Identity;
  style: FrameStyle;
  shape: FrameShape;
  overlay?: OverlaySpec;
  finalized?: boolean;
};

export default function ResultActions({
  photo,
  placement,
  identity,
  style,
  shape,
  overlay,
  finalized = true,
}: Props) {
  const fileName = overlay ? "hh-goa-frame.png" : `${SHAPE[shape].fileName}.png`;
  const [busy, setBusy] = useState<null | "download" | "share">(null);
  const [note, setNote] = useState<string | null>(null);

  // cache the rendered PNG so Share can fire synchronously (keeps iOS activation)
  const blobRef = useRef<Blob | null>(null);
  const dirtyRef = useRef(true);

  const build = async () => {
    const blob = await renderToBlob({
      photo: photo.bitmap,
      photoSize: photo.size,
      placement,
      identity,
      style,
      shape,
      overlay,
      finalized,
    });
    blobRef.current = blob;
    dirtyRef.current = false;
    return blob;
  };

  // invalidate + debounce-prerender whenever the composition changes
  useEffect(() => {
    dirtyRef.current = true;
    const t = setTimeout(() => {
      if (dirtyRef.current) build().catch(() => {});
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photo,
    placement.scale,
    placement.offsetX,
    placement.offsetY,
    identity.name,
    identity.handle,
    identity.builderClass,
    style,
    shape,
    overlay,
    finalized,
  ]);

  const onDownload = async () => {
    setBusy("download");
    setNote(null);
    try {
      const blob =
        !dirtyRef.current && blobRef.current ? blobRef.current : await build();
      downloadBlob(blob, fileName);
    } catch {
      setNote("Couldn't render. Try a smaller photo.");
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    setNote(null);
    // fast path: cached blob + native share (synchronous → preserves activation)
    if (!dirtyRef.current && blobRef.current && canShareFiles()) {
      const res = await shareImageFile(blobRef.current, SHARE.defaultCaption);
      if (res !== "unsupported") return;
    }
    setBusy("share");
    try {
      const blob =
        !dirtyRef.current && blobRef.current ? blobRef.current : await build();
      const res = await shareImageFile(blob, SHARE.defaultCaption);
      if (res === "unsupported") {
        // Desktop / no file-share: upload to Blob and share a /s/[id] link whose
        // OG image IS the generated graphic, so the X preview shows it.
        try {
          const { shareId } = await uploadFrame(blob);
          const shareUrl = `${window.location.origin}/s/${shareId}`;
          window.open(tweetUrl(shareUrl), "_blank", "noopener,noreferrer");
          setNote("Opened X with a preview link. You can also Download the PNG.");
        } catch {
          // Blob not configured / offline: text intent + hand them the file.
          window.open(tweetUrl(), "_blank", "noopener,noreferrer");
          downloadBlob(blob, fileName);
          setNote("Opened X. Image downloaded so you can attach it to the post.");
        }
      }
    } catch {
      setNote("Couldn't prepare the share. Try Download instead.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
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
      {note && (
        <p className="rounded-lg border-2 border-ink/25 bg-paper-2 px-3 py-2 font-mono text-[0.7rem] text-ink/75">
          {note}
        </p>
      )}
    </div>
  );
}
