/**
 * Frame shapes — geometry for different outputs. `mode: "bleed"` = photo fills the
 * canvas (PFP); `mode: "badge"` = photo in a clean window with an illustrated frame;
 * `mode: "ticket"` = boarding-pass ID card (photo + name + QR metadata). All coords
 * are logical units (export scales up).
 */
export type FrameShape =
  | "square"
  | "circle"
  | "tall"
  | "arch"
  | "landscape"
  | "ticket";

export const FRAME_SHAPES: FrameShape[] = [
  "square",
  "circle",
  "tall",
  "arch",
  "landscape",
  "ticket",
];

export type WindowKind = "rect" | "circle" | "arch";

export type ShapeConfig = {
  label: string;
  mode: "bleed" | "badge" | "ticket";
  w: number;
  h: number;
  window: {
    x: number;
    y: number;
    w: number;
    h: number;
    kind: WindowKind;
    radius: number;
  };
  panel?: { x: number; y: number; w: number; h: number };
  fileName: string;
};

export const SHAPE: Record<FrameShape, ShapeConfig> = {
  square: {
    label: "Square",
    mode: "bleed",
    w: 1200,
    h: 1200,
    window: { x: 0, y: 0, w: 1200, h: 1200, kind: "rect", radius: 0 },
    fileName: "hh-goa-square",
  },
  circle: {
    label: "Circle",
    mode: "bleed",
    w: 1200,
    h: 1200,
    window: { x: 100, y: 100, w: 1000, h: 1000, kind: "circle", radius: 500 },
    fileName: "hh-goa-circle",
  },
  tall: {
    label: "Badge",
    mode: "badge",
    w: 1080,
    h: 1350,
    window: { x: 96, y: 250, w: 888, h: 760, kind: "rect", radius: 32 },
    panel: { x: 96, y: 1044, w: 888, h: 214 },
    fileName: "hh-goa-badge",
  },
  arch: {
    label: "Arch",
    mode: "badge",
    w: 1080,
    h: 1350,
    window: { x: 96, y: 236, w: 888, h: 812, kind: "arch", radius: 444 },
    panel: { x: 96, y: 1080, w: 888, h: 178 },
    fileName: "hh-goa-arch",
  },
  landscape: {
    label: "Card",
    mode: "bleed",
    w: 1200,
    h: 630,
    window: { x: 0, y: 0, w: 1200, h: 630, kind: "rect", radius: 0 },
    fileName: "hh-goa-card",
  },
  ticket: {
    label: "Ticket",
    mode: "ticket",
    w: 1000,
    h: 1500,
    window: { x: 70, y: 205, w: 860, h: 600, kind: "rect", radius: 28 },
    panel: { x: 70, y: 840, w: 860, h: 150 },
    fileName: "hh-goa-ticket",
  },
};
