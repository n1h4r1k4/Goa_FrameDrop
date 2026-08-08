/** Canvas/export constants — see the frame-generator skill. */

/** Logical square size of the exported PFP (device px = this × exportScale). */
export const EXPORT_SIZE = 1200;

/** iOS Safari hard cap on total canvas area (~16.7 MP). Exceeding => black/null PNG. */
export const MAX_CANVAS_AREA = 16_777_216;

/** iOS safe per-dimension cap. */
export const MAX_CANVAS_SIDE = 4096;

/** Retina target; 3× adds no visible gain and risks the cap + memory. */
export const TARGET_DPR = 2;

/** On-screen interactive preview size (CSS px, square). */
export const PREVIEW_SIZE = 360;
