/**
 * Deterministic "builder class" from a name/handle — same person always gets the
 * same on-brand title. Optional flavor for the frame. See frame-generator skill.
 */
const CLASSES = [
  "Terminal Dweller",
  "Shader Alchemist",
  "Latency Slayer",
  "Protocol Pirate",
  "Midnight Shipper",
  "Sandbox Sovereign",
  "Kernel Whisperer",
  "Regex Ronin",
  "Pixel Druid",
  "Buffer Overlord",
  "Async Nomad",
  "Commit Cowboy",
  "Monsoon Maker",
  "Beachhead Builder",
] as const;

function hash(seed: string): number {
  let h = 0;
  for (const ch of seed) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function builderClass(seed: string): string {
  const s = seed.trim();
  if (!s) return "";
  return CLASSES[hash(s) % CLASSES.length];
}

/** Deterministic pass serial — the same builder always gets the same number. */
export function passSerial(seed: string): string {
  return `HHG-2026-${String(hash(seed.trim() || "HHG") % 10000).padStart(4, "0")}`;
}
