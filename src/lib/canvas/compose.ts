/**
 * Compose pipeline: bg → photo → sunset frame → dynamic text/stamp. The SAME
 * function drives the interactive preview and the export (pass target canvas + side px).
 * See the frame-generator + hhgoa-brand skills.
 */
import { COLORS, EVENT, SHARE, LINKS, WORDMARK } from "@/lib/brand";
import { coverRect, type Placement, type PhotoSize } from "./transform";
import { FONT } from "./fonts";

export type Identity = { name?: string; handle?: string; builderClass?: string };

export type ComposeInput = {
  ctx: CanvasRenderingContext2D;
  side: number; // device px (square)
  photo: CanvasImageSource;
  photoSize: PhotoSize;
  placement: Placement;
  /** Optional rasterized brand overlay (transparent center). If absent, the scene is drawn in code. */
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
    drawDynamicLayer(ctx, side, identity);
  } else {
    drawSunsetScene(ctx, side);
    drawBorder(ctx, side);
    drawStudioTag(ctx, side);
    drawStamp(ctx, side);
    drawDynamicLayer(ctx, side, identity);
  }
}

// ---------- geometry helpers ----------

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

const PAD = (S: number) => S * 0.035;
const HORIZON = (S: number) => S * 0.8;

// ---------- scene ----------

function drawPalm(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  h: number,
  flip: boolean,
): void {
  ctx.save();
  ctx.translate(baseX, baseY);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = COLORS.goaGreenDeep;
  ctx.fillStyle = COLORS.goaGreenDeep;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // trunk: gentle lean outward
  const topX = h * 0.16;
  const topY = -h;
  ctx.lineWidth = Math.max(2, h * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-h * 0.05, -h * 0.55, topX, topY);
  ctx.stroke();

  // fronds arcing up then drooping
  const fronds: Array<[number, number]> = [
    [-0.95, 0.9],
    [-0.55, 1.05],
    [-0.1, 1.05],
    [0.4, 0.95],
    [0.85, 0.75],
  ];
  const L = h * 0.6;
  for (const [dir, up] of fronds) {
    ctx.lineWidth = Math.max(2, h * 0.03);
    const ex = topX + dir * L;
    const ey = topY + L * 0.28;
    const cx = topX + dir * L * 0.45;
    const cy = topY - up * h * 0.18;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  // coconuts
  ctx.beginPath();
  ctx.arc(topX - h * 0.03, topY + h * 0.03, h * 0.03, 0, Math.PI * 2);
  ctx.arc(topX + h * 0.05, topY + h * 0.05, h * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSunsetScene(ctx: CanvasRenderingContext2D, S: number): void {
  const hY = HORIZON(S);
  const cx = S * 0.5;

  // warm glow around the sun (over the photo)
  const glow = ctx.createRadialGradient(cx, hY, S * 0.02, cx, hY, S * 0.42);
  glow.addColorStop(0, "rgba(254,225,1,0.45)");
  glow.addColorStop(0.5, "rgba(249,220,1,0.14)");
  glow.addColorStop(1, "rgba(249,220,1,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, hY - S * 0.42, S, S * 0.62);

  // sun dome sitting on the horizon
  const rSun = S * 0.13;
  const sunGrad = ctx.createLinearGradient(cx, hY - rSun, cx, hY);
  sunGrad.addColorStop(0, COLORS.sun1);
  sunGrad.addColorStop(1, COLORS.sun3);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, hY, rSun, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = sunGrad;
  ctx.fill();
  // retro stripes cut into the sun
  ctx.globalCompositeOperation = "destination-out";
  const stripeH = rSun * 0.11;
  for (let i = 1; i <= 3; i++) {
    const y = hY - rSun * (i * 0.26);
    ctx.fillRect(cx - rSun, y, rSun * 2, stripeH);
  }
  ctx.restore();

  // rays fanning up from the sun
  ctx.save();
  ctx.strokeStyle = "rgba(254,225,1,0.5)";
  ctx.lineCap = "round";
  for (let i = -3; i <= 3; i++) {
    const a = -Math.PI / 2 + i * 0.28;
    const r0 = rSun * 1.2;
    const r1 = rSun * (1.7 + Math.abs(i) * 0.08);
    ctx.lineWidth = Math.max(1.5, S * 0.006);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, hY + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, hY + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // beach band below the horizon
  const band = ctx.createLinearGradient(0, hY, 0, S);
  band.addColorStop(0, "rgba(11,104,57,0.0)");
  band.addColorStop(0.25, "rgba(10,42,24,0.55)");
  band.addColorStop(1, "rgba(10,42,24,0.94)");
  ctx.fillStyle = band;
  ctx.fillRect(0, hY, S, S - hY);

  // horizon line + short reflection ticks
  ctx.strokeStyle = "rgba(254,225,1,0.85)";
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.beginPath();
  ctx.moveTo(PAD(S) + S * 0.02, hY);
  ctx.lineTo(S - PAD(S) - S * 0.02, hY);
  ctx.stroke();
  ctx.strokeStyle = "rgba(254,225,1,0.35)";
  for (let i = 1; i <= 3; i++) {
    const w = rSun * (1 - i * 0.22);
    const y = hY + i * S * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx - w, y);
    ctx.lineTo(cx + w, y);
    ctx.stroke();
  }

  // palms flanking the bottom corners
  const palmH = S * 0.3;
  drawPalm(ctx, PAD(S) + S * 0.035, S - PAD(S) - S * 0.01, palmH, false);
  drawPalm(ctx, S - PAD(S) - S * 0.035, S - PAD(S) - S * 0.01, palmH, true);
}

// ---------- chrome ----------

function drawBorder(ctx: CanvasRenderingContext2D, S: number): void {
  const pad = PAD(S);
  const rad = S * 0.055;
  const bw = S * 0.02;
  roundRectPath(ctx, pad, pad, S - pad * 2, S - pad * 2, rad);
  const bg = ctx.createLinearGradient(pad, pad, S - pad, S - pad);
  bg.addColorStop(0, COLORS.sun1);
  bg.addColorStop(0.5, COLORS.sun3);
  bg.addColorStop(1, COLORS.red);
  ctx.lineWidth = bw;
  ctx.strokeStyle = bg;
  ctx.stroke();

  const inset = pad + bw * 1.5;
  roundRectPath(ctx, inset, inset, S - inset * 2, S - inset * 2, rad * 0.75);
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.strokeStyle = "rgba(255,251,232,0.45)";
  ctx.stroke();
}

function drawStudioTag(ctx: CanvasRenderingContext2D, S: number): void {
  const pad = PAD(S);
  const x = pad + S * 0.03;
  const y = pad + S * 0.03;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.sun1;
  ctx.font = `700 ${S * 0.03}px ${FONT.mono()}`;
  ctx.fillText("2:47", x, y);
  ctx.fillStyle = "rgba(255,251,232,0.85)";
  ctx.font = `500 ${S * 0.016}px ${FONT.mono()}`;
  ctx.fillText("PM STUDIO", x + S * 0.062, y + S * 0.006);
  ctx.restore();
}

function drawStamp(ctx: CanvasRenderingContext2D, S: number): void {
  const pad = PAD(S);
  ctx.save();
  const w = S * 0.26;
  const h = S * 0.048;
  const cx = S - pad - S * 0.02 - w / 2;
  const cy = pad + S * 0.055;
  ctx.translate(cx, cy);
  ctx.rotate(-0.06);
  roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.strokeStyle = COLORS.sun1;
  ctx.stroke();
  ctx.fillStyle = COLORS.sun1;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${S * 0.019}px ${FONT.mono()}`;
  ctx.fillText(EVENT.editionLabel.toUpperCase(), 0, S * 0.001);
  ctx.restore();
}

/** Dynamic (per-user) text over any frame: identity + hashtag. */
function drawDynamicLayer(
  ctx: CanvasRenderingContext2D,
  S: number,
  identity?: Identity,
): void {
  const pad = PAD(S);
  const left = pad + S * 0.05;
  const baseY = S - pad - S * 0.06;
  const disp = FONT.display();
  const mono = FONT.mono();
  const deva = FONT.deva();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (identity?.name) {
    ctx.fillStyle = COLORS.sun1;
    ctx.font = `800 ${S * 0.07}px ${disp}`;
    ctx.fillText(truncate(identity.name, 16), left, baseY);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${S * 0.024}px ${mono}`;
    const sub = identity.builderClass
      ? `// ${identity.builderClass}`
      : `HH GOA 2026`;
    ctx.fillText(sub.toUpperCase(), left, baseY + S * 0.035);
  } else {
    // "HH GOA 2026" with a small गोवा accent
    ctx.fillStyle = COLORS.sun1;
    ctx.font = `800 ${S * 0.066}px ${disp}`;
    ctx.fillText("HH GOA", left, baseY);
    const w = ctx.measureText("HH GOA").width;
    ctx.fillStyle = COLORS.red;
    ctx.font = `800 ${S * 0.03}px ${deva}`;
    ctx.fillText(WORDMARK.deva, left + w + S * 0.012, baseY - S * 0.03);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${S * 0.022}px ${mono}`;
    ctx.fillText(`${EVENT.location} · ${EVENT.dates}`, left, baseY + S * 0.033);
  }

  // hashtag + site (bottom-right)
  ctx.textAlign = "right";
  const right = S - pad - S * 0.05;
  ctx.fillStyle = COLORS.sun1;
  ctx.font = `700 ${S * 0.03}px ${mono}`;
  ctx.fillText(`#${SHARE.hashtag}`, right, baseY);
  ctx.fillStyle = "rgba(255,251,232,0.75)";
  ctx.font = `400 ${S * 0.019}px ${mono}`;
  ctx.fillText(LINKS.site.replace(/^https?:\/\//, "").replace(/\/$/, ""), right, baseY + S * 0.03);
}
