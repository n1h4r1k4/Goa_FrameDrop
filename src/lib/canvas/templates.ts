/**
 * Image-based frame templates (AI-designed PNGs with a transparent photo window).
 * `window` = the photo area as fractions of the square canvas. Drop a new PNG in
 * public/frames/ with a flat magenta window, cut it transparent, and add an entry.
 */
export type TemplateDef = {
  id: string;
  label: string;
  src: string;
  window: { x: number; y: number; w: number; h: number };
};

export const TEMPLATES: TemplateDef[] = [
  {
    id: "badge",
    label: "Sunset Badge",
    src: "/frames/tmpl-badge.png",
    window: { x: 0.2676, y: 0.1074, w: 0.5879, h: 0.6426 },
  },
  {
    id: "circle",
    label: "Sunset Circle",
    src: "/frames/tmpl-circle.png",
    window: { x: 0.2695, y: 0.1973, w: 0.502, h: 0.5703 },
  },
  {
    id: "arch",
    label: "Midnight Arch",
    src: "/frames/tmpl-arch.png",
    window: { x: 0.2266, y: 0.2324, w: 0.6777, h: 0.7676 },
  },
  {
    id: "pass",
    label: "Boarding Pass",
    src: "/frames/tmpl-pass.png",
    window: { x: 0.2285, y: 0.0, w: 0.4805, h: 0.6016 },
  },
];
