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

export function builderClass(seed: string): string {
  const s = seed.trim();
  if (!s) return "";
  let h = 0;
  for (const ch of s) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
  return CLASSES[Math.abs(h) % CLASSES.length];
}
