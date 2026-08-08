/**
 * Compose pipeline: bg → photo → frame → dynamic text/stamp. Same function drives
 * the interactive preview and the export (pass the target canvas + its side px).
 * See the frame-generator + hhgoa-brand skills.
 */
import { COLORS, EVENT, SHARE } from "@/lib/brand";
import { coverRect, type Placement, type PhotoSize } from "./transform";
import { FONT } from "./fonts";

export type Identity = { name?: string; handle?: string; builderClass?: string };

export type ComposeInput = {
  ctx: CanvasRenderingContext2D;
  side: number; // device px (square)
  photo: CanvasImageSource;
  photoSize: PhotoSize;
  placement: Placement;
  /** Optional rasterized brand overlay (transparent center). If absent, a code frame is drawn. */
  overlay?: CanvasImageSource | null;
  identity?: Identity;
};

export function compose(input: ComposeInput): void {
  const { ctx, side, photo, photoSize, placement, overlay, identity } = input;

  ctx.clearRect(0, 0, side, side);

  // 1) background (covers any transparency around the photo)
  ctx.fillStyle = COLORS.goaGreen;
  ctx.fillRect(0, 0, side, side);

  // 2) photo (cover-fit + pan/zoom)
  const r = coverRect(side, photoSize, placement);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);

  // 3) brand frame
  if (overlay) {
    ctx.drawImage(overlay, 0, 0, side, side);
    drawDynamicLayer(ctx, side, identity); // identity/stamp still drawn in code
  } else {
    drawCodeFrame(ctx, side, identity);
  }
}

// ---------- drawing helpers ----------

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

function drawSunMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = COLORS.sun1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.sun1;
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
    ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStamp(ctx: CanvasRenderingContext2D, S: number, pad: number): void {
  ctx.save();
  const w = S * 0.28;
  const h = S * 0.05;
  const cx = S - pad - S * 0.02 - w / 2;
  const cy = pad + S * 0.06;
  ctx.translate(cx, cy);
  ctx.rotate(-0.06);
  roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.strokeStyle = COLORS.sun1;
  ctx.stroke();
  ctx.fillStyle = COLORS.sun1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${S * 0.02}px ${FONT.mono()}`;
  ctx.fillText(EVENT.editionLabel.toUpperCase(), 0, S * 0.002);
  ctx.restore();
}

/** Dynamic (per-user) text drawn over ANY frame: identity + hashtag + stamp. */
function drawDynamicLayer(
  ctx: CanvasRenderingContext2D,
  S: number,
  identity?: Identity,
): void {
  const pad = S * 0.035;
  const left = pad + S * 0.045;
  const baseY = S - pad - S * 0.055;
  const disp = FONT.display();
  const mono = FONT.mono();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  if (identity?.name) {
    ctx.fillStyle = COLORS.sun1;
    ctx.font = `800 ${S * 0.075}px ${disp}`;
    ctx.fillText(truncate(identity.name, 18), left, baseY);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${S * 0.026}px ${mono}`;
    const sub = identity.builderClass
      ? `// ${identity.builderClass}`
      : "HH GOA 2026";
    ctx.fillText(sub.toUpperCase(), left, baseY + S * 0.038);
  } else {
    ctx.fillStyle = COLORS.sun1;
    ctx.font = `800 ${S * 0.07}px ${disp}`;
    ctx.fillText("HH GOA 2026", left, baseY);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${S * 0.024}px ${mono}`;
    ctx.fillText(`${EVENT.location} · ${EVENT.dates}`, left, baseY + S * 0.036);
  }

  // hashtag + site (bottom-right)
  ctx.textAlign = "right";
  const right = S - pad - S * 0.045;
  ctx.fillStyle = COLORS.sun1;
  ctx.font = `700 ${S * 0.03}px ${mono}`;
  ctx.fillText(`#${SHARE.hashtag}`, right, baseY);
  ctx.fillStyle = "rgba(255,251,232,0.75)";
  ctx.font = `400 ${S * 0.02}px ${mono}`;
  ctx.fillText("hhgoa.com", right, baseY + S * 0.03);

  drawStamp(ctx, S, pad);
}

/** Full code-drawn brand frame (used until the rasterized SVG overlay ships). */
function drawCodeFrame(
  ctx: CanvasRenderingContext2D,
  S: number,
  identity?: Identity,
): void {
  const pad = S * 0.035;
  const rad = S * 0.055;

  // bottom scrim for text legibility
  const scrimTop = S * 0.64;
  const g = ctx.createLinearGradient(0, scrimTop, 0, S);
  g.addColorStop(0, "rgba(10,42,24,0)");
  g.addColorStop(1, "rgba(10,42,24,0.92)");
  ctx.fillStyle = g;
  ctx.fillRect(0, scrimTop, S, S - scrimTop);

  // outer border (sunset gradient)
  const bw = S * 0.02;
  roundRectPath(ctx, pad, pad, S - pad * 2, S - pad * 2, rad);
  const bg = ctx.createLinearGradient(pad, pad, S - pad, S - pad);
  bg.addColorStop(0, COLORS.sun1);
  bg.addColorStop(0.5, COLORS.sun3);
  bg.addColorStop(1, COLORS.red);
  ctx.lineWidth = bw;
  ctx.strokeStyle = bg;
  ctx.stroke();

  // thin inner keyline
  const inset = pad + bw * 1.5;
  roundRectPath(ctx, inset, inset, S - inset * 2, S - inset * 2, rad * 0.75);
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.strokeStyle = "rgba(255,251,232,0.5)";
  ctx.stroke();

  drawSunMark(ctx, pad + S * 0.06, pad + S * 0.06, S * 0.05);
  drawDynamicLayer(ctx, S, identity);
}
