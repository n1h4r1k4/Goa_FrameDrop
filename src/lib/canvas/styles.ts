/**
 * Frame style presets. Each drives the sunset-scene treatment + border + accents
 * in compose.ts. See the hhgoa-brand / frame-generator skills.
 */
import { COLORS } from "@/lib/brand";

export type FrameStyle = "sunset" | "midnight" | "palm";
export const FRAME_STYLES: FrameStyle[] = ["sunset", "midnight", "palm"];

export type StyleConfig = {
  label: string;
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
  sunset: {
    label: "Sunset",
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
  midnight: {
    label: "Midnight",
    celestial: "moon",
    celestialTop: "#fffbe8",
    celestialBottom: "#e7dcae",
    glow: "rgba(190,214,255,0.22)",
    scrim: "rgba(3,17,11,0.96)",
    border: [COLORS.cream, COLORS.sun2, COLORS.sun3],
    palmColor: "#04150d",
    palmScale: 1,
    stars: true,
    rays: false,
    horizon: "rgba(255,251,232,0.6)",
    accent: COLORS.sun1,
  },
  palm: {
    label: "Palm",
    celestial: "sun",
    celestialTop: COLORS.sun1,
    celestialBottom: COLORS.sun2,
    glow: "rgba(254,225,1,0.5)",
    scrim: "rgba(10,42,24,0.9)",
    border: [COLORS.sun1, COLORS.sun1, COLORS.sun3],
    palmColor: COLORS.cream,
    palmScale: 1.42,
    stars: false,
    rays: true,
    horizon: "rgba(254,225,1,0.85)",
    accent: COLORS.sun1,
  },
};
