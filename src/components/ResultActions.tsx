"use client";

import { useEffect, useRef, useState } from "react";
import { renderToBlob, downloadBlob } from "@/lib/canvas/export";
import { shareImageFile, canShareFiles } from "@/lib/share/webshare";
import { tweetUrl } from "@/lib/share/intent";
import { uploadFrame } from "@/lib/blob/client";
import { SHARE } from "@/lib/brand";
import type { DecodedPhoto } from "@/lib/heic/decode";
import type { Placement } from "@/lib/canvas/transform";
import type { Identity } from "@/lib/canvas/compose";
import type { FrameStyle } from "@/lib/canvas/styles";
import { SHAPE, type FrameShape } from "@/lib/canvas/shapes";

type Props = {
  photo: DecodedPhoto;
  placement: Placement;
  identity: Identity;
  style: FrameStyle;
  shape: FrameShape;
};

export default function ResultActions({
  photo,
  placement,
  identity,
  style,
  shape,
}: Props) {
  const fileName = `${SHAPE[shape].fileName}.png`;
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
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          disabled={busy !== null}
          className="flex-1 rounded-full bg-sun-1 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-goa-green-deep transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy === "download" ? "Rendering…" : "↓ Download PNG"}
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={busy !== null}
          className="flex-1 rounded-full border-2 border-sun-1 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-widest text-sun-1 transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy === "share" ? "Preparing…" : `Share to X · #${SHARE.hashtag}`}
        </button>
      </div>
      {note && <p className="font-mono text-xs text-cream/70">{note}</p>}
    </div>
  );
}
