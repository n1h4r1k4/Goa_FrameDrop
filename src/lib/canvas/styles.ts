/**
 * Frame style presets. Each drives the sunset-scene treatment + border + accents
 * in compose.ts. See the hhgoa-brand / frame-generator skills.
 */
import { COLORS } from "@/lib/brand";

export type FrameStyle = "sunset" | "midnight" | "palm";
export const FRAME_STYLES: FrameStyle[] = ["sunset", "midnight", "palm"];

export type StyleConfig = {
  label: string;
  /** card background — the main thing that tells the three themes apart */
  bg: string;
  /** ink for the translucent scene washed behind the card */
  sceneInk: string;
  celestial: "sun" | "moon";
  celestialTop: string;
  celestialBottom: string;
  glow: string; // rgba
  scrim: string; // rgba (opaque end of the beach band)
  border: [string, string, string]; // gradient stops
  palmColor: string;
  palmScale: number;
  stars: boolean;
  rays: boolean;
  horizon: string; // rgba/hex
  accent: string; // text accent
};

export const STYLE: Record<FrameStyle, StyleConfig> = {
  // Goa green + a golden sun — the brand card.
  sunset: {
    label: "Sunset",
    bg: COLORS.goaGreen,
    sceneInk: COLORS.cream,
    celestial: "sun",
    celestialTop: COLORS.sun1,
    celestialBottom: COLORS.sun3,
    glow: "rgba(254,225,1,0.45)",
    scrim: "rgba(10,42,24,0.94)",
    border: [COLORS.sun1, COLORS.sun3, COLORS.red],
    palmColor: COLORS.cream,
    palmScale: 1,
    stars: false,
    rays: true,
    horizon: "rgba(254,225,1,0.85)",
    accent: COLORS.sun1,
  },
  // Near-black navy, a moon and a sky full of stars.
  midnight: {
    label: "Midnight",
    bg: "#06131f",
    sceneInk: "#9fb6d8",
    celestial: "moon",
    celestialTop: "#fffbe8",
    celestialBottom: "#e7dcae",
    glow: "rgba(150,186,255,0.26)",
    scrim: "rgba(2,8,16,0.96)",
    border: [COLORS.cream, COLORS.sun2, COLORS.sun3],
    palmColor: "#020a12",
    palmScale: 1.1,
    stars: true,
    rays: false,
    horizon: "rgba(190,214,255,0.6)",
    accent: COLORS.sun1,
  },
  // Deep lagoon teal with oversized palms — cool where Sunset is warm, so the
  // two no longer read as the same green card.
  palm: {
    label: "Palm",
    bg: "#053e46",
    sceneInk: "#a8f0e0",
    celestial: "sun",
    celestialTop: "#8ff3dc",
    celestialBottom: "#2bb9a4",
    glow: "rgba(53,214,192,0.42)",
    scrim: "rgba(3,26,32,0.92)",
    border: ["#5fe6c8", COLORS.sun1, "#2bb9a4"],
    palmColor: COLORS.cream,
    palmScale: 1.6,
    stars: false,
    rays: false,
    horizon: "rgba(95,230,200,0.85)",
    accent: "#7ef0d6",
  },
};
