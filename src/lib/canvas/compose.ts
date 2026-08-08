/**
 * Shape- + style-aware compositor. `mode:"bleed"` (square/circle/landscape) fills the
 * canvas with the photo and overlays the sunset scene; `mode:"badge"` (tall/arch) puts
 * the photo in a clean window with an illustrated frame + cream name panel.
 * Same function drives preview and export. See frame-generator + hhgoa-brand skills.
 */
import { COLORS, EVENT, SHARE, LINKS } from "@/lib/brand";
import { coverRectIn, type Placement, type PhotoSize } from "./transform";
import { FONT } from "./fonts";
import { STYLE, type FrameStyle, type StyleConfig } from "./styles";
import { SHAPE, type FrameShape } from "./shapes";

export type Identity = { name?: string; handle?: string; builderClass?: string };

export type ComposeInput = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  photo: CanvasImageSource;
  photoSize: PhotoSize;
  placement: Placement;
  identity?: Identity;
  style?: FrameStyle;
  shape?: FrameShape;
};

export function compose(input: ComposeInput): void {
  const { ctx, w, h, photo, photoSize, placement, identity } = input;
  const shapeCfg = SHAPE[input.shape ?? "square"];
  const cfg = STYLE[input.style ?? "sunset"];
  const k = w / shapeCfg.w;
  const win = {
    x: shapeCfg.window.x * k,
    y: shapeCfg.window.y * k,
    w: shapeCfg.window.w * k,
    h: shapeCfg.window.h * k,
    kind: shapeCfg.window.kind,
    radius: shapeCfg.window.radius * k,
  };

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.goaGreen;
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (shapeCfg.mode === "badge") {
    composeBadge(ctx, w, h, k, win, cfg, photo, photoSize, placement, identity, shapeCfg);
  } else {
    composeBleed(ctx, w, h, k, win, cfg, photo, photoSize, placement, identity, shapeCfg);
  }
}

// ---------- primitives ----------

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function archPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const top = Math.min(w / 2, h * 0.42);
  const br = w * 0.06;
  ctx.beginPath();
  ctx.moveTo(x, y + top);
  ctx.quadraticCurveTo(x, y, x + w / 2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + top);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + br, y + h);
  ctx.arcTo(x, y + h, x, y + h - br, br);
  ctx.closePath();
}

function windowPath(
  ctx: CanvasRenderingContext2D,
  win: { x: number; y: number; w: number; h: number; kind: string; radius: number },
): void {
  if (win.kind === "circle") {
    ctx.beginPath();
    ctx.arc(win.x + win.w / 2, win.y + win.h / 2, win.w / 2, 0, Math.PI * 2);
    ctx.closePath();
  } else if (win.kind === "arch") {
    archPath(ctx, win.x, win.y, win.w, win.h);
  } else {
    roundRectPath(ctx, win.x, win.y, win.w, win.h, win.radius);
  }
}

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

function drawPalmAt(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  h: number,
  flip: boolean,
  color: string,
): void {
  ctx.save();
  ctx.translate(bx, by);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const tx = h * 0.16;
  const ty = -h;
  ctx.lineWidth = Math.max(2, h * 0.045);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-h * 0.05, -h * 0.55, tx, ty);
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
    const ex = tx + dir * L;
    const ey = ty + L * 0.28;
    const cx = tx + dir * L * 0.45;
    const cy = ty - up * h * 0.18;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(tx - h * 0.03, ty + h * 0.03, h * 0.03, 0, Math.PI * 2);
  ctx.arc(tx + h * 0.05, ty + h * 0.05, h * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCelestial(
  ctx: CanvasRenderingContext2D,
  cx: number,
  hy: number,
  r: number,
  cfg: StyleConfig,
): void {
  const glow = ctx.createRadialGradient(cx, hy, r * 0.2, cx, hy, r * 3.2);
  glow.addColorStop(0, cfg.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 3.2, hy - r * 3.2, r * 6.4, r * 3.4);

  const g = ctx.createLinearGradient(cx, hy - r, cx, hy);
  g.addColorStop(0, cfg.celestialTop);
  g.addColorStop(1, cfg.celestialBottom);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, hy, r, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  if (cfg.celestial === "sun") {
    ctx.globalCompositeOperation = "destination-out";
    const sh = r * 0.11;
    for (let i = 1; i <= 3; i++) ctx.fillRect(cx - r, hy - r * (i * 0.26), r * 2, sh);
  }
  ctx.restore();

  if (cfg.rays) {
    ctx.save();
    ctx.strokeStyle = "rgba(254,225,1,0.5)";
    ctx.lineCap = "round";
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.28;
      ctx.lineWidth = Math.max(1.5, r * 0.05);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 1.2, hy + Math.sin(a) * r * 1.2);
      ctx.lineTo(cx + Math.cos(a) * r * 1.75, hy + Math.sin(a) * r * 1.75);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Beach scene within a region (x,y,w,h) with horizon near the bottom. */
function drawSceneRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cfg: StyleConfig,
  palms = true,
): void {
  const hy = y + h * 0.72;
  const cx = x + w / 2;
  const r = Math.min(w, h) * 0.14;

  if (cfg.stars) {
    ctx.save();
    ctx.fillStyle = "rgba(255,251,232,0.85)";
    const pts = [
      [0.14, 0.16],
      [0.3, 0.1],
      [0.5, 0.18],
      [0.68, 0.1],
      [0.86, 0.17],
      [0.22, 0.32],
      [0.78, 0.32],
    ];
    for (const [fx, fy] of pts) {
      ctx.beginPath();
      ctx.arc(x + fx * w, y + fy * h, Math.max(1.2, w * 0.004), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawCelestial(ctx, cx, hy, r, cfg);

  // reflection ripples
  ctx.fillStyle = cfg.celestialBottom;
  for (let i = 1; i <= 3; i++) {
    const rw = r * (1 - i * 0.22);
    ctx.beginPath();
    ctx.ellipse(cx, hy + i * h * 0.03, rw, Math.max(1, h * 0.006), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // beach band
  const band = ctx.createLinearGradient(0, hy, 0, y + h);
  band.addColorStop(0, "rgba(11,104,57,0)");
  band.addColorStop(0.3, "rgba(10,42,24,0.5)");
  band.addColorStop(1, cfg.scrim);
  ctx.fillStyle = band;
  ctx.fillRect(x, hy, w, y + h - hy);

  // horizon
  ctx.strokeStyle = cfg.horizon;
  ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.05, hy);
  ctx.lineTo(x + w * 0.95, hy);
  ctx.stroke();

  if (palms) {
    const ph = h * 0.34;
    drawPalmAt(ctx, x + w * 0.1, y + h - h * 0.02, ph, false, cfg.palmColor);
    drawPalmAt(ctx, x + w * 0.9, y + h - h * 0.02, ph, true, cfg.palmColor);
  }
}

// ---------- shared chrome ----------

function drawStudioTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  unit: number,
  cfg: StyleConfig,
): void {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = cfg.accent;
  ctx.font = `700 ${unit * 30}px ${FONT.mono()}`;
  ctx.fillText("2:47", x, y);
  ctx.fillStyle = "rgba(255,251,232,0.85)";
  ctx.font = `500 ${unit * 16}px ${FONT.mono()}`;
  ctx.fillText("PM STUDIO", x + unit * 62, y + unit * 6);
  ctx.restore();
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unit: number,
  cfg: StyleConfig,
): void {
  ctx.save();
  const w = unit * 300;
  const h = unit * 52;
  ctx.translate(cx, cy);
  ctx.rotate(-0.06);
  roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.lineWidth = Math.max(1, unit * 4);
  ctx.strokeStyle = cfg.accent;
  ctx.stroke();
  ctx.fillStyle = cfg.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${unit * 21}px ${FONT.mono()}`;
  ctx.fillText(EVENT.editionLabel.toUpperCase(), 0, unit * 1);
  ctx.restore();
}

// ---------- bleed mode (square / circle / landscape) ----------

function composeBleed(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  k: number,
  win: { x: number; y: number; w: number; h: number; kind: string; radius: number },
  cfg: StyleConfig,
  photo: CanvasImageSource,
  photoSize: PhotoSize,
  placement: Placement,
  identity: Identity | undefined,
  shapeCfg: (typeof SHAPE)[FrameShape],
): void {
  const isCircle = win.kind === "circle";

  ctx.save();
  windowPath(ctx, win);
  ctx.clip();
  const r = coverRectIn(win.x, win.y, win.w, win.h, photoSize, placement);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  drawSceneRegion(ctx, win.x, win.y, win.w, win.h, cfg);
  ctx.restore();

  // border
  if (isCircle) {
    ctx.save();
    windowPath(ctx, win);
    ctx.lineWidth = W * 0.02;
    const bg = ctx.createLinearGradient(win.x, win.y, win.x + win.w, win.y + win.h);
    bg.addColorStop(0, cfg.border[0]);
    bg.addColorStop(0.5, cfg.border[1]);
    bg.addColorStop(1, cfg.border[2]);
    ctx.strokeStyle = bg;
    ctx.stroke();
    ctx.restore();
  } else {
    const pad = W * 0.03;
    roundRectPath(ctx, pad, pad, W - pad * 2, H - pad * 2, W * 0.045);
    const bg = ctx.createLinearGradient(pad, pad, W - pad, H - pad);
    bg.addColorStop(0, cfg.border[0]);
    bg.addColorStop(0.5, cfg.border[1]);
    bg.addColorStop(1, cfg.border[2]);
    ctx.lineWidth = W * 0.018;
    ctx.strokeStyle = bg;
    ctx.stroke();
    roundRectPath(ctx, pad * 1.7, pad * 1.7, W - pad * 3.4, H - pad * 3.4, W * 0.035);
    ctx.lineWidth = Math.max(1, W * 0.003);
    ctx.strokeStyle = "rgba(255,251,232,0.45)";
    ctx.stroke();
  }

  // chrome
  const u = k;
  drawStudioTag(ctx, W * 0.05, H * (shapeCfg.h === 630 ? 0.06 : 0.045), u, cfg);
  drawStamp(ctx, W - W * 0.05 - u * 150, H * (shapeCfg.h === 630 ? 0.1 : 0.075), u, cfg);
  drawBleedText(ctx, W, H, u, cfg, identity, isCircle);
}

function drawBleedText(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  u: number,
  cfg: StyleConfig,
  identity: Identity | undefined,
  isCircle: boolean,
): void {
  const disp = FONT.display();
  const mono = FONT.mono();
  const deva = FONT.deva();
  const baseY = H - H * 0.06;
  const left = W * 0.07;
  const right = W - W * 0.07;

  if (isCircle) {
    // minimal chrome in the green corners
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = cfg.accent;
    ctx.font = `700 ${u * 34}px ${mono}`;
    ctx.fillText(`#${SHARE.hashtag}`, W / 2, H - H * 0.045);
    return;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  if (identity?.name) {
    ctx.fillStyle = cfg.accent;
    ctx.font = `800 ${u * 84}px ${disp}`;
    ctx.fillText(truncate(identity.name, 16), left, baseY);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${u * 28}px ${mono}`;
    ctx.fillText(
      (identity.builderClass ? `// ${identity.builderClass}` : "HH GOA 2026").toUpperCase(),
      left,
      baseY + u * 42,
    );
  } else {
    ctx.fillStyle = cfg.accent;
    ctx.font = `800 ${u * 80}px ${disp}`;
    ctx.fillText("HH GOA", left, baseY);
    const w = ctx.measureText("HH GOA").width;
    ctx.font = `800 ${u * 36}px ${deva}`;
    const gx = left + w + u * 14;
    const gy = baseY - u * 36;
    ctx.lineJoin = "round";
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = u * 7;
    ctx.strokeText("गोवा", gx, gy);
    ctx.fillStyle = COLORS.pink;
    ctx.fillText("गोवा", gx, gy);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `500 ${u * 26}px ${mono}`;
    ctx.fillText(`${EVENT.location} · ${EVENT.dates}`, left, baseY + u * 40);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = cfg.accent;
  ctx.font = `700 ${u * 34}px ${mono}`;
  ctx.fillText(`#${SHARE.hashtag}`, right, baseY);
  ctx.fillStyle = "rgba(255,251,232,0.75)";
  ctx.font = `400 ${u * 22}px ${mono}`;
  const rightSub = identity?.handle
    ? `@${identity.handle.replace(/^@/, "")}`
    : LINKS.site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  ctx.fillText(rightSub, right, baseY + u * 34);
}

// ---------- badge mode (tall / arch) ----------

function composeBadge(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  k: number,
  win: { x: number; y: number; w: number; h: number; kind: string; radius: number },
  cfg: StyleConfig,
  photo: CanvasImageSource,
  photoSize: PhotoSize,
  placement: Placement,
  identity: Identity | undefined,
  shapeCfg: (typeof SHAPE)[FrameShape],
): void {
  const u = k;
  const m = W * 0.03;

  // outer ornate border
  roundRectPath(ctx, m, m, W - m * 2, H - m * 2, W * 0.05);
  const og = ctx.createLinearGradient(m, m, W - m, H - m);
  og.addColorStop(0, cfg.border[0]);
  og.addColorStop(0.5, cfg.border[1]);
  og.addColorStop(1, cfg.border[2]);
  ctx.lineWidth = W * 0.016;
  ctx.strokeStyle = og;
  ctx.stroke();
  roundRectPath(ctx, m * 1.7, m * 1.7, W - m * 3.4, H - m * 3.4, W * 0.04);
  ctx.lineWidth = Math.max(1, W * 0.003);
  ctx.strokeStyle = "rgba(255,251,232,0.4)";
  ctx.stroke();

  // header wordmark
  drawBadgeHeader(ctx, W, win.y, u, cfg);

  // side palms flanking the window
  drawPalmAt(ctx, win.x * 0.52, win.y + win.h * 0.98, win.h * 0.5, false, cfg.palmColor);
  drawPalmAt(ctx, W - win.x * 0.52, win.y + win.h * 0.98, win.h * 0.5, true, cfg.palmColor);

  // photo window
  ctx.save();
  windowPath(ctx, win);
  ctx.clip();
  const r = coverRectIn(win.x, win.y, win.w, win.h, photoSize, placement);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  ctx.restore();

  // window border
  ctx.save();
  windowPath(ctx, win);
  ctx.lineWidth = W * 0.013;
  ctx.strokeStyle = cfg.accent;
  ctx.stroke();
  ctx.lineWidth = Math.max(1, W * 0.004);
  ctx.strokeStyle = COLORS.pink;
  ctx.stroke();
  ctx.restore();

  // cream name panel
  if (shapeCfg.panel) {
    const p = {
      x: shapeCfg.panel.x * k,
      y: shapeCfg.panel.y * k,
      w: shapeCfg.panel.w * k,
      h: shapeCfg.panel.h * k,
    };
    drawPanel(ctx, p, u, cfg, identity);
  }

  // heritage stamp, top-right inside border
  drawStamp(ctx, W - m - W * 0.02 - u * 150, m + W * 0.05, u, cfg);
}

function drawBadgeHeader(
  ctx: CanvasRenderingContext2D,
  W: number,
  topH: number,
  u: number,
  cfg: StyleConfig,
): void {
  const cx = W / 2;
  const fs = Math.min(topH * 0.34, W * 0.11);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = cfg.accent;
  ctx.font = `800 ${fs}px ${FONT.display()}`;
  ctx.fillText("HACKER", cx, topH * 0.46);
  ctx.fillText("HOUSE", cx, topH * 0.86);
  // गोवा sticker centered between lines
  const gy = topH * 0.66;
  ctx.font = `800 ${fs * 0.6}px ${FONT.deva()}`;
  ctx.lineJoin = "round";
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = fs * 0.05;
  ctx.strokeText("गोवा", cx, gy);
  ctx.fillStyle = COLORS.pink;
  ctx.fillText("गोवा", cx, gy);
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; w: number; h: number },
  u: number,
  cfg: StyleConfig,
  identity: Identity | undefined,
): void {
  roundRectPath(ctx, p.x, p.y, p.w, p.h, u * 24);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.lineWidth = Math.max(1, u * 4);
  ctx.strokeStyle = COLORS.pink;
  ctx.stroke();

  const cx = p.x + p.w / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  if (identity?.name) {
    ctx.fillStyle = COLORS.goaGreenDeep;
    ctx.font = `800 ${u * 70}px ${FONT.display()}`;
    ctx.fillText(truncate(identity.name, 18), cx, p.y + p.h * 0.42);
    if (identity.builderClass) {
      ctx.fillStyle = COLORS.pink;
      ctx.font = `600 ${u * 26}px ${FONT.mono()}`;
      ctx.fillText(`// ${identity.builderClass.toUpperCase()}`, cx, p.y + p.h * 0.64);
    }
  } else {
    ctx.fillStyle = COLORS.goaGreenDeep;
    ctx.font = `800 ${u * 60}px ${FONT.display()}`;
    ctx.fillText("HH GOA 2026", cx, p.y + p.h * 0.46);
  }

  ctx.fillStyle = COLORS.goaGreen;
  ctx.font = `500 ${u * 24}px ${FONT.mono()}`;
  ctx.fillText(
    `#${SHARE.hashtag}  ·  ${EVENT.dates}`,
    cx,
    p.y + p.h * (identity?.name && identity.builderClass ? 0.86 : 0.78),
  );
}
