/**
 * Web Share API Level 2 (attach the real PNG on mobile). Feature-detect files
 * support and call share() as synchronously as possible to keep the user
 * activation valid. See the share-og skill.
 */
export type ShareResult = "shared" | "cancelled" | "unsupported";

export function canShareFiles(file?: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function")
    return false;
  const probe =
    file ?? new File([new Blob()], "probe.png", { type: "image/png" });
  try {
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function shareImageFile(
  blob: Blob,
  text: string,
  filename = "hh-goa-2026.png",
): Promise<ShareResult> {
  const file = new File([blob], filename, { type: "image/png" });
  if (!canShareFiles(file)) return "unsupported";
  try {
    await navigator.share({ files: [file], text, title: "HH Goa 2026" });
    return "shared";
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}
