/**
 * Web Share API Level 2 (attach the real PNG on mobile). Feature-detect files
 * support and call share() as synchronously as possible to keep the user
 * activation valid. See the share-og skill.
 */
export type ShareResult = "shared" | "cancelled" | "unsupported";

/**
 * Should we hand off to the OS share sheet at all?
 *
 * Only on touch devices. Desktop Chromium *does* implement Web Share for files,
 * but the macOS/Windows sheet it opens offers AirDrop / Mail / Notes and no X —
 * so "Share to X" would dead-end in the OS picker. On a pointer device we skip
 * it and drive the X composer directly.
 */
export function prefersNativeShare(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return coarse && canShareFiles();
}

export function canShareFiles(files?: File[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function")
    return false;
  const probe = files?.length
    ? files
    : [new File([new Blob()], "probe.png", { type: "image/png" })];
  try {
    return navigator.canShare({ files: probe });
  } catch {
    return false;
  }
}

export async function shareImageFile(
  blob: Blob,
  text: string,
  filename = "hh-goa-2026.png",
): Promise<ShareResult> {
  return shareImageFiles([blob], text, [filename]);
}

/**
 * Share one or more PNGs through the OS sheet.
 *
 * Both faces of the pass are worth sending, but not every target accepts a
 * multi-file share — so each candidate set is run past canShare() *before*
 * share() is called, and we drop to the first file alone if the pair is
 * refused. Checking first matters: a share() that throws has already spent the
 * user activation, so a retry after the fact would fail anyway.
 */
export async function shareImageFiles(
  blobs: Blob[],
  text: string,
  names: string[] = [],
): Promise<ShareResult> {
  const files = blobs.map(
    (b, i) =>
      new File([b], names[i] ?? `hh-goa-2026-${i + 1}.png`, {
        type: "image/png",
      }),
  );
  if (!files.length) return "unsupported";

  const candidates = files.length > 1 ? [files, [files[0]]] : [files];
  for (const set of candidates) {
    if (!canShareFiles(set)) continue;
    try {
      await navigator.share({ files: set, text, title: "HH Goa 2026" });
      return "shared";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
      // fall through and try the smaller set
    }
  }
  return "unsupported";
}
