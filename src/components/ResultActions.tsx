"use client";

import { useEffect, useRef, useState } from "react";
import {
  renderToBlob,
  renderToCanvas,
  renderCardBackToCanvas,
  renderShareCardToBlob,
  downloadBlob,
} from "@/lib/canvas/export";
import { shareImageFiles, prefersNativeShare } from "@/lib/share/webshare";
import { tweetUrl, openComposerTab, nativeCaption } from "@/lib/share/intent";
import { copyImageDuringClick, pasteShortcut } from "@/lib/share/clipboard";
import { uploadFrame } from "@/lib/blob/client";
import { getShareOrigin } from "@/lib/siteUrl";
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

  // Cache both rendered faces so Share can fire synchronously (keeps iOS
  // activation) and can hand over the whole pass, not just the side on screen.
  const facesRef = useRef<{ front: Blob; back: Blob } | null>(null);
  const dirtyRef = useRef(true);

  const source = () => ({
    photo: photo.bitmap,
    photoSize: photo.size,
    placement,
    identity,
    style,
    shape,
    overlay,
    finalized,
  });

  const build = async () => {
    const src = source();
    const [front, qr] = await Promise.all([
      renderToBlob(src),
      renderToBlob({ ...src, back: true }),
    ]);
    facesRef.current = { front, back: qr };
    dirtyRef.current = false;
    return facesRef.current;
  };

  const faces = async () =>
    !dirtyRef.current && facesRef.current ? facesRef.current : build();

  /**
   * Everything the desktop composer path needs. The plate carries both faces
   * because X shows exactly one image for a link and allows exactly one paste.
   */
  const buildSharePayload = async () => {
    const src = source();
    const dims = overlay
      ? { w: 1080, h: 1080 }
      : { w: SHAPE[shape].w, h: SHAPE[shape].h };
    const [pair, frontCanvas, backCanvas] = await Promise.all([
      faces(),
      renderToCanvas(src),
      renderCardBackToCanvas({ ...dims, identity, style, finalized }),
    ]);
    const plate = await renderShareCardToBlob({
      pass: frontCanvas,
      back: backCanvas,
      style,
      identity,
    });
    return { plate, front: pair.front, back: pair.back };
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
      const pair = await faces();
      downloadBlob(back ? pair.back : pair.front, fileName);
    } catch {
      setNote("Couldn't render. Try a smaller photo.");
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    setNote(null);

    // Phone/tablet: go to X itself. The OS sheet can attach the real PNGs, but
    // it cannot be aimed at an app — it drops the user in a picker and "Share
    // to X" dead-ends one tap short. Navigating to the intent instead lands in
    // the X composer directly (the x.com URL is an App Link on Android and a
    // universal link on iOS), and the /s link previews the pass, so the graphic
    // still rides along. A same-tab navigation needs no popup permission and
    // survives the awaits above it.
    if (prefersNativeShare()) {
      setBusy("share");
      try {
        const { plate, front, back: qr } = await buildSharePayload();
        const { shareId } = await uploadFrame(front, plate, qr);
        window.location.href = tweetUrl(`${getShareOrigin()}/s/${shareId}`);
        return;
      } catch {
        // No network / Blob unconfigured: the sheet still carries both real
        // PNGs and still lists X. One tap further, but it works offline.
        try {
          const pair = await faces();
          const res = await shareImageFiles(
            [pair.front, pair.back],
            nativeCaption(),
            [`${stem}.png`, `${stem}-back.png`],
          );
          if (res !== "unsupported") return;
        } catch {
          /* fall through to the note */
        }
        setNote("Couldn't reach the network. Download the PNG and post it manually.");
        return;
      } finally {
        setBusy(null);
      }
    }

    // Desktop: straight to the X composer. Both the clipboard write and the tab
    // open have to start inside the click, before any await, or the activation
    // is spent — hence the promise handed to the clipboard rather than a blob.
    //
    // The clipboard gets the *plate*, not the single face on screen: X's intent
    // URL has no media parameter, so pasting is the only way an actual image
    // gets attached to the post — and the user only gets one paste.
    const payload = buildSharePayload();
    const copied = copyImageDuringClick(payload.then((p) => p.plate));
    const win = openComposerTab();

    setBusy("share");
    try {
      const { plate, front, back: qr } = await payload;
      let url: string;
      let hosted = false;
      try {
        // front = the pass /s shows, plate = the link preview, qr = the flip
        const { shareId } = await uploadFrame(front, plate, qr);
        url = tweetUrl(`${getShareOrigin()}/s/${shareId}`);
        hosted = true;
      } catch {
        // Blob store not configured / offline: post the text, and get the image
        // to them another way.
        url = tweetUrl();
      }
      if (win) win.location.replace(url);
      else window.open(url, "_blank", "noopener,noreferrer");

      const preview = hosted ? " The link previews it too." : "";
      if (await copied) {
        setNote(
          `Opened X — press ${pasteShortcut()} in the composer to attach your pass, both sides.${preview}`,
        );
      } else {
        downloadBlob(plate, `${stem}-share.png`);
        setNote(
          `Opened X. The clipboard wasn't available, so your pass downloaded — drag it into the composer.${preview}`,
        );
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
