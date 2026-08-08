"use client";

import { useEffect, useRef, useState } from "react";
import { renderToBlob, downloadBlob } from "@/lib/canvas/export";
import { shareImageFile, prefersNativeShare } from "@/lib/share/webshare";
import { tweetUrl, openComposerTab } from "@/lib/share/intent";
import { copyImageDuringClick, pasteShortcut } from "@/lib/share/clipboard";
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
  /** the preview is flipped — download/share the QR side instead */
  back?: boolean;
};

export default function ResultActions({
  photo,
  placement,
  identity,
  style,
  shape,
  overlay,
  finalized = true,
  back = false,
}: Props) {
  const stem = overlay ? "hh-goa-frame" : SHAPE[shape].fileName;
  const fileName = `${stem}${back ? "-back" : ""}.png`;
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
      back,
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
    back,
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

    // Phone/tablet: the OS sheet lists X and carries the real PNG. Fire it as
    // synchronously as possible so the activation survives.
    if (prefersNativeShare()) {
      try {
        const blob =
          !dirtyRef.current && blobRef.current ? blobRef.current : await build();
        const res = await shareImageFile(blob, SHARE.defaultCaption, fileName);
        if (res !== "unsupported") return;
      } catch {
        /* fall through to the composer */
      }
    }

    // Desktop: straight to the X composer. Both the clipboard write and the tab
    // open have to start inside the click, before any await, or the activation
    // is spent — hence the promise handed to the clipboard rather than a blob.
    const png =
      !dirtyRef.current && blobRef.current
        ? Promise.resolve(blobRef.current)
        : build();
    const copied = copyImageDuringClick(png);
    const win = openComposerTab();

    setBusy("share");
    try {
      const blob = await png;
      let url: string;
      let hosted = false;
      try {
        const { shareId } = await uploadFrame(blob);
        url = tweetUrl(`${window.location.origin}/s/${shareId}`);
        hosted = true;
      } catch {
        // Blob store not configured / offline: post the text, and get the image
        // to them another way.
        url = tweetUrl();
      }
      if (win) win.location.replace(url);
      else window.open(url, "_blank", "noopener,noreferrer");

      if (hosted) {
        setNote("Opened X — your pass is the link preview on the post.");
      } else if (await copied) {
        setNote(
          `Opened X. Your pass is on the clipboard — press ${pasteShortcut()} in the composer to attach it.`,
        );
      } else {
        downloadBlob(blob, fileName);
        setNote("Opened X. Image downloaded so you can attach it to the post.");
      }
    } catch {
      win?.close();
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
