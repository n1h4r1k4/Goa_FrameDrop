/**
 * Put the rendered PNG on the clipboard so it can be pasted straight into the X
 * composer.
 *
 * X's web intent can carry text and a URL but cannot attach a file — the only
 * ways to get an image into a post from the browser are the OS share sheet
 * (mobile), a hosted image X can preview (needs Blob), or the user pasting it.
 * This covers the last one.
 *
 * ClipboardItem accepts a *promise* for the blob, which is the whole point: the
 * write starts synchronously inside the click and the render finishes
 * afterwards, so the transient user activation isn't spent waiting.
 */
export function copyImageDuringClick(png: Promise<Blob>): Promise<boolean> {
  try {
    if (
      typeof ClipboardItem === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.clipboard?.write
    ) {
      // png may still be awaited by the caller; don't leave it unhandled
      png.catch(() => {});
      return Promise.resolve(false);
    }
    return navigator.clipboard
      .write([new ClipboardItem({ "image/png": png })])
      .then(() => true)
      .catch(() => false);
  } catch {
    png.catch(() => {});
    return Promise.resolve(false);
  }
}

/** ⌘V on a Mac, Ctrl+V everywhere else. */
export function pasteShortcut(): string {
  const mac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return mac ? "⌘V" : "Ctrl+V";
}
