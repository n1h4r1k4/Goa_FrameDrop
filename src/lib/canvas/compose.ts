/**
 * Compose pipeline: bg → photo → sunset frame → dynamic text/stamp. The SAME
 * function drives the interactive preview and the export (pass target canvas + side px).
 * Style-driven via src/lib/canvas/styles.ts. See frame-generator + hhgoa-brand skills.
 */
import { COLORS, EVENT, SHARE, LINKS } from "@/lib/brand";
import { coverRect, type Placement, type PhotoSize } from "./transform";
import { FONT } from "./fonts";
import { STYLE, type FrameStyle, type StyleConfig } from "./styles";

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
  style?: FrameStyle;
};

export function compose(input: ComposeInput): void {
  const { ctx, side, photo, photoSize, placement, overlay, identity } = input;
  const cfg = STYLE[input.style ?? "sunset"];

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
    drawDynamicLayer(ctx, side, identity, cfg);
  } else {
    drawScene(ctx, side, cfg);
    drawBorder(ctx, side, cfg.border);
    drawStudioTag(ctx, side, cfg);
    drawStamp(ctx, side, cfg);
    drawDynamicLayer(ctx, side, identity, cfg);
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

// deterministic star field (fractions of S, in the upper region)
const STARS: Array<[number, number, number]> = [
  [0.12, 0.14, 0.006],
  [0.22, 0.28, 0.004],
  [0.34, 0.1, 0.005],
  [0.46, 0.2, 0.004],
  [0.58, 0.12, 0.006],
  [0.7, 0.26, 0.004],
  [0.8, 0.16, 0.005],
  [0.88, 0.3, 0.004],
  [0.16, 0.4, 0.004],
  [0.64, 0.38, 0.005],
  [0.9, 0.46, 0.004],
  [0.3, 0.46, 0.004],
];

// ---------- scene ----------

function drawPalm(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  h: number,
  flip: boolean,
  color: string,
): void {
  ctx.save();
  ctx.translate(baseX, baseY);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const topX = h * 0.16;
  const topY = -h;
  ctx.lineWidth = Math.max(2, h * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-h * 0.05, -h * 0.55, topX, topY);
  ctx.stroke();

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
  ctx.beginPath();
  ctx.arc(topX - h * 0.03, topY + h * 0.03, h * 0.03, 0, Math.PI * 2);
  ctx.arc(topX + h * 0.05, topY + h * 0.05, h * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  S: number,
  cfg: StyleConfig,
): void {
  const hY = HORIZON(S);
  const cx = S * 0.5;

  // stars (midnight)
  if (cfg.stars) {
    ctx.save();
    ctx.fillStyle = "rgba(255,251,232,0.85)";
    for (const [fx, fy, fr] of STARS) {
      ctx.beginPath();
      ctx.arc(fx * S, fy * S, fr * S, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // warm/cool glow around the celestial body
  const glow = ctx.createRadialGradient(cx, hY, S * 0.02, cx, hY, S * 0.42);
  glow.addColorStop(0, cfg.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, hY - S * 0.42, S, S * 0.62);

  // celestial dome sitting on the horizon
  const r = S * 0.13;
  const grad = ctx.createLinearGradient(cx, hY - r, cx, hY);
  grad.addColorStop(0, cfg.celestialTop);
  grad.addColorStop(1, cfg.celestialBottom);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, hY, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  if (cfg.celestial === "sun") {
    // retro stripes cut into the sun
    ctx.globalCompositeOperation = "destination-out";
    const stripeH = r * 0.11;
    for (let i = 1; i <= 3; i++) {
      ctx.fillRect(cx - r, hY - r * (i * 0.26), r * 2, stripeH);
    }
  }
  ctx.restore();

  // rays (sun styles)
  if (cfg.rays) {
    ctx.save();
    ctx.strokeStyle = "rgba(254,225,1,0.5)";
    ctx.lineCap = "round";
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.28;
      const r0 = r * 1.2;
      const r1 = r * (1.7 + Math.abs(i) * 0.08);
      ctx.lineWidth = Math.max(1.5, S * 0.006);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, hY + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, hY + Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // beach band below the horizon
  const band = ctx.createLinearGradient(0, hY, 0, S);
  band.addColorStop(0, "rgba(11,104,57,0)");
  band.addColorStop(0.25, "rgba(10,42,24,0.55)");
  band.addColorStop(1, cfg.scrim);
  ctx.fillStyle = band;
  ctx.fillRect(0, hY, S, S - hY);

  // horizon line + short reflection ticks
  ctx.strokeStyle = cfg.horizon;
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.beginPath();
  ctx.moveTo(PAD(S) + S * 0.02, hY);
  ctx.lineTo(S - PAD(S) - S * 0.02, hY);
  ctx.stroke();
  ctx.strokeStyle = cfg.horizon;
  ctx.globalAlpha = 0.4;
  for (let i = 1; i <= 3; i++) {
    const w = r * (1 - i * 0.22);
    const y = hY + i * S * 0.02;
    ctx.beginPath();
    ctx.moveTo(cx - w, y);
    ctx.lineTo(cx + w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // palms flanking the bottom corners
  const palmH = S * 0.3 * cfg.palmScale;
  drawPalm(ctx, PAD(S) + S * 0.035, S - PAD(S) - S * 0.01, palmH, false, cfg.palmColor);
  drawPalm(ctx, S - PAD(S) - S * 0.035, S - PAD(S) - S * 0.01, palmH, true, cfg.palmColor);
}

// ---------- chrome ----------

function drawBorder(
  ctx: CanvasRenderingContext2D,
  S: number,
  border: [string, string, string],
): void {
  const pad = PAD(S);
  const rad = S * 0.055;
  const bw = S * 0.02;
  roundRectPath(ctx, pad, pad, S - pad * 2, S - pad * 2, rad);
  const bg = ctx.createLinearGradient(pad, pad, S - pad, S - pad);
  bg.addColorStop(0, border[0]);
  bg.addColorStop(0.5, border[1]);
  bg.addColorStop(1, border[2]);
  ctx.lineWidth = bw;
  ctx.strokeStyle = bg;
  ctx.stroke();

  const inset = pad + bw * 1.5;
  roundRectPath(ctx, inset, inset, S - inset * 2, S - inset * 2, rad * 0.75);
  ctx.lineWidth = Math.max(1, S * 0.004);
  ctx.strokeStyle = "rgba(255,251,232,0.45)";
  ctx.stroke();
}

function drawStudioTag(
  ctx: CanvasRenderingContext2D,
  S: number,
  cfg: StyleConfig,
): void {
  const pad = PAD(S);
  const x = pad + S * 0.03;
  const y = pad + S * 0.03;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = cfg.accent;
  ctx.font = `700 ${S * 0.03}px ${FONT.mono()}`;
  ctx.fillText("2:47", x, y);
  ctx.fillStyle = "rgba(255,251,232,0.85)";
  ctx.font = `500 ${S * 0.016}px ${FONT.mono()}`;
  ctx.fillText("PM STUDIO", x + S * 0.062, y + S * 0.006);
  ctx.restore();
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  S: number,
  cfg: StyleConfig,
): void {
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
  ctx.strokeStyle = cfg.accent;
  ctx.stroke();
  ctx.fillStyle = cfg.accent;
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
  identity: Identity | undefined,
  cfg: StyleConfig,
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
    ctx.fillStyle = cfg.accent;
    ctx.font = `800 ${S * 0.07}px ${disp}`;
    ctx.fillText(truncate(identity.name, 16), left, baseY);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${S * 0.024}px ${mono}`;
    const sub = identity.builderClass
      ? `// ${identity.builderClass}`
      : `HH GOA 2026`;
    ctx.fillText(sub.toUpperCase(), left, baseY + S * 0.035);
  } else {
    ctx.fillStyle = cfg.accent;
    ctx.font = `800 ${S * 0.066}px ${disp}`;
    ctx.fillText("HH GOA", left, baseY);
    const w = ctx.measureText("HH GOA").width;
    ctx.font = `800 ${S * 0.03}px ${deva}`;
    const gx = left + w + S * 0.012;
    const gy = baseY - S * 0.03;
    ctx.lineJoin = "round";
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = S * 0.006;
    ctx.strokeText("गोवा", gx, gy);
    ctx.fillStyle = COLORS.pink;
    ctx.fillText("गोवा", gx, gy);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${S * 0.022}px ${mono}`;
    ctx.fillText(`${EVENT.location} · ${EVENT.dates}`, left, baseY + S * 0.033);
  }

  // hashtag + handle/site (bottom-right)
  ctx.textAlign = "right";
  const right = S - pad - S * 0.05;
  ctx.fillStyle = cfg.accent;
  ctx.font = `700 ${S * 0.03}px ${mono}`;
  ctx.fillText(`#${SHARE.hashtag}`, right, baseY);
  ctx.fillStyle = "rgba(255,251,232,0.75)";
  ctx.font = `400 ${S * 0.019}px ${mono}`;
  const rightSub = identity?.handle
    ? `@${identity.handle.replace(/^@/, "")}`
    : LINKS.site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  ctx.fillText(rightSub, right, baseY + S * 0.03);
}
