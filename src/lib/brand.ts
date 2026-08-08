/**
 * HH Goa 2026 — brand constants (single source of truth for JS/canvas).
 * Keep in sync with the palette in src/app/globals.css and the hhgoa-brand skill.
 */

export const COLORS = {
  goaGreen: "#0b6839",
  goaGreenDeep: "#0a2a18",
  sun1: "#fee101",
  sun2: "#edd723",
  sun3: "#f9dc01",
  cream: "#fffbe8",
  red: "#e2231a",
  pink: "#e6198a",
  white: "#ffffff",
} as const;

export const EVENT = {
  name: "Hacker House Goa 2026",
  shortName: "HH Goa 2026",
  tagline: "Less Noise. More Signal.",
  descriptor: "the country's biggest build-station",
  location: "GOA, INDIA",
  dates: "28–31 OCT 2026",
  /** honors the "old Hacker House" lineage — baked into the exported frame */
  editionLabel: "Est. • 5th edition",
  seriesCities: ["Chennai", "Amaravati", "Bangalore", "Trivandrum", "Goa"] as const,
  stats2024: { registrations: "6,800+", hackers: "390+", projects: "100" },
} as const;

export const LINKS = {
  site: "https://hhgoa.com/",
  apply: "https://hacker-house-goa-2026.devfolio.co/",
  studioName: "2:47 pm Studio",
  studioX: "https://x.com/247pmstudio",
  studioTelegram: "https://t.me/twofourtysevenpm",
  studioEmail: "mailto:satapathyprayasu@gmail.com",
} as const;

export const SHARE = {
  hashtag: "FrameInGoa",
  handle: "@247pmstudio",
  defaultCaption:
    "Locked in for HH Goa 2026. Building on the sand, 28–31 Oct. #FrameInGoa",
} as const;

/** Bilingual wordmark: English + गोवा (Devanagari, red). */
export const WORDMARK = {
  line1: "HACKER",
  line2: "HOUSE",
  deva: "गोवा",
} as const;
