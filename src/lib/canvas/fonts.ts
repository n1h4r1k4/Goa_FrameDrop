/**
 * next/font assigns fonts to CSS variables under hashed family names, so canvas
 * `ctx.font` must reference those computed values (not "Imbue"). Read them from
 * :root and make sure they're loaded before drawing text. See frame-generator skill.
 */

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export const FONT = {
  display: () => cssVar("--font-imbue", "Georgia, serif"),
  mono: () => cssVar("--font-victor-mono", "ui-monospace, monospace"),
  deva: () => cssVar("--font-deva", "system-ui, sans-serif"),
};

/** Ensure the brand faces are loaded so canvas text doesn't fall back to a system font. */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const probes = [
    `800 40px ${FONT.display()}`,
    `500 24px ${FONT.mono()}`,
    `700 40px ${FONT.deva()}`,
  ];
  try {
    await Promise.all(probes.map((f) => document.fonts.load(f)));
  } catch {
    /* ignore — best effort */
  }
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
}
