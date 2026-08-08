/**
 * Shape- + style-aware compositor. Simplistic look: the PHOTO is the hero (never
 * covered by scenery) inside a pink double-border; branding sits at the edges
 * (title top, meta bottom) or, for badges, in a cream name panel.
 * Same function drives preview and export. See frame-generator + hhgoa-brand skills.
 */
import { COLORS, EVENT, SHARE } from "@/lib/brand";
import { coverRectIn, type Placement, type PhotoSize } from "./transform";
import { FONT } from "./fonts";
import { STYLE, type FrameStyle, type StyleConfig } from "./styles";
import { SHAPE, type FrameShape } from "./shapes";
import { makeQR, metadataText, type QRMatrix } from "@/lib/qr";

const PINK = COLORS.pink;
const CREAM = COLORS.cream;
const SUN = COLORS.sun1;
const GREEN = COLORS.goaGreen;
const DEEP = COLORS.goaGreenDeep;

export type Identity = { name?: string; handle?: string; builderClass?: string };

/** An image template overlay with a transparent photo window (fractions of the canvas). */
export type OverlaySpec = {
  img: CanvasImageSource;
  window: { x: number; y: number; w: number; h: number };
};

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
  overlay?: OverlaySpec;
  finalized?: boolean;
};

type Win = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: string;
  radius: number;
};

export function compose(input: ComposeInput): void {
  const { ctx, w, h, photo, photoSize, placement, identity } = input;
  if (input.overlay) {
    composeOverlay(ctx, w, h, photo, photoSize, placement, input.overlay);
    return;
  }
  const shapeCfg = SHAPE[input.shape ?? "square"];
  const cfg = STYLE[input.style ?? "sunset"];
  const k = w / shapeCfg.w;
  const win: Win = {
    x: shapeCfg.window.x * k,
    y: shapeCfg.window.y * k,
    w: shapeCfg.window.w * k,
    h: shapeCfg.window.h * k,
    kind: shapeCfg.window.kind,
    radius: shapeCfg.window.radius * k,
  };

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (shapeCfg.mode === "ticket") {
    composeTicket(ctx, w, h, k, win, cfg, photo, photoSize, placement, identity, input.finalized ?? true);
  } else if (shapeCfg.mode === "badge") {
    composeBadge(ctx, w, h, k, win, cfg, photo, photoSize, placement, identity, shapeCfg);
  } else {
    composeBleed(ctx, w, h, k, win, cfg, photo, photoSize, placement, identity);
  }
}

// ---------- path helpers ----------

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
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

function windowPath(ctx: CanvasRenderingContext2D, win: Win, inset = 0): void {
  if (win.kind === "circle") {
    ctx.beginPath();
    ctx.arc(win.x + win.w / 2, win.y + win.h / 2, win.w / 2 - inset, 0, Math.PI * 2);
    ctx.closePath();
  } else if (win.kind === "arch") {
    archPath(ctx, win.x + inset, win.y + inset, win.w - inset * 2, win.h - inset * 2);
  } else {
    roundRectPath(
      ctx,
      win.x + inset,
      win.y + inset,
      win.w - inset * 2,
      win.h - inset * 2,
      Math.max(0, win.radius - inset),
    );
  }
}

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

// ---------- decorative helpers ----------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,251,232,0.05)";
  ctx.lineWidth = Math.max(1, u * 1.4);
  const step = w / 12;
  for (let gx = x; gx <= x + w + 1; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h + 1; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
  ctx.restore();
}

function pinkBorderWindow(ctx: CanvasRenderingContext2D, win: Win, W: number): void {
  windowPath(ctx, win, 0);
  ctx.lineWidth = W * 0.016;
  ctx.strokeStyle = PINK;
  ctx.stroke();
  windowPath(ctx, win, W * 0.026);
  ctx.lineWidth = Math.max(1, W * 0.006);
  ctx.strokeStyle = PINK;
  ctx.stroke();
}

function pinkBorderRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  W: number,
): void {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.lineWidth = W * 0.016;
  ctx.strokeStyle = PINK;
  ctx.stroke();
  const g = W * 0.022;
  roundRectPath(ctx, x + g, y + g, w - g * 2, h - g * 2, Math.max(0, r - g));
  ctx.lineWidth = Math.max(1, W * 0.006);
  ctx.strokeStyle = PINK;
  ctx.stroke();
}

function drawSmallSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save();
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = SUN;
  ctx.lineWidth = Math.max(1, r * 0.13);
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    ctx.lineTo(cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 1.08);
    ctx.stroke();
  }
  ctx.restore();
}

/** Cream name tag with pink border + deep-green text. Returns its width. */
function drawNamePill(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  text: string,
  u: number,
  align: "left" | "center" = "left",
  cx = 0,
): number {
  const t = text.toUpperCase();
  ctx.font = `700 ${u * 26}px ${FONT.display()}`;
  const tw = ctx.measureText(t).width;
  const px = u * 18;
  const h = u * 46;
  const w = tw + px * 2;
  const left = align === "center" ? cx - w / 2 : x;
  roundRectPath(ctx, left, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = Math.max(1, u * 3.5);
  ctx.strokeStyle = PINK;
  ctx.stroke();
  ctx.fillStyle = DEEP;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(t, left + px, cy + u * 1);
  return w;
}

function palm(
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
  ctx.lineWidth = Math.max(2, h * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-h * 0.05, -h * 0.55, tx, ty);
  ctx.stroke();
  const fronds: Array<[number, number]> = [
    [-0.95, 0.9],
    [-0.5, 1.05],
    [-0.05, 1.05],
    [0.45, 0.95],
    [0.85, 0.75],
  ];
  const L = h * 0.58;
  for (const [dir, up] of fronds) {
    ctx.lineWidth = Math.max(2, h * 0.035);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + dir * L * 0.45, ty - up * h * 0.18, tx + dir * L, ty + L * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  u: number,
  color: string,
): void {
  ctx.save();
  const w = u * 300;
  const h = u * 52;
  ctx.translate(cx, cy);
  ctx.rotate(-0.05);
  roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.lineWidth = Math.max(1, u * 3.5);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${u * 20}px ${FONT.mono()}`;
  ctx.fillText(EVENT.editionLabel.toUpperCase(), 0, u * 1);
  ctx.restore();
}

// ---------- bleed mode (square / circle / landscape) ----------

function composeBleed(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  k: number,
  win: Win,
  cfg: StyleConfig,
  photo: CanvasImageSource,
  photoSize: PhotoSize,
  placement: Placement,
  identity: Identity | undefined,
): void {
  const u = k;
  const isCircle = win.kind === "circle";
  const pad = W * 0.05;

  // photo (fills the window) + subtle top/bottom scrims only at the edges
  ctx.save();
  windowPath(ctx, win);
  ctx.clip();
  const r = coverRectIn(win.x, win.y, win.w, win.h, photoSize, placement);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);

  const th = win.h * 0.17;
  const tg = ctx.createLinearGradient(0, win.y, 0, win.y + th);
  tg.addColorStop(0, "rgba(10,42,24,0.62)");
  tg.addColorStop(1, "rgba(10,42,24,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(win.x, win.y, win.w, th);

  const bh = win.h * 0.2;
  const bg = ctx.createLinearGradient(0, win.y + win.h - bh, 0, win.y + win.h);
  bg.addColorStop(0, "rgba(10,42,24,0)");
  bg.addColorStop(1, "rgba(10,42,24,0.8)");
  ctx.fillStyle = bg;
  ctx.fillRect(win.x, win.y + win.h - bh, win.w, bh);
  ctx.restore();

  pinkBorderWindow(ctx, win, W);

  // title (top) + small sun
  ctx.textBaseline = "top";
  if (isCircle) {
    ctx.textAlign = "center";
    ctx.fillStyle = CREAM;
    ctx.font = `800 ${u * 44}px ${FONT.display()}`;
    ctx.fillText("HH GOA 2026", win.x + win.w / 2, win.y + pad);
  } else {
    ctx.textAlign = "left";
    ctx.fillStyle = CREAM;
    ctx.font = `800 ${u * 46}px ${FONT.display()}`;
    ctx.fillText("HH GOA 2026", win.x + pad, win.y + pad * 0.8);
    ctx.fillStyle = PINK;
    ctx.font = `600 ${u * 21}px ${FONT.mono()}`;
    ctx.fillText(`#${SHARE.hashtag}`, win.x + pad, win.y + pad * 0.8 + u * 52);
    drawSmallSun(ctx, win.x + win.w - pad - u * 6, win.y + pad + u * 14, u * 20);
  }

  // bottom row: name pill (or wordmark) + meta
  const by = win.y + win.h - pad * 0.85;
  ctx.textBaseline = "alphabetic";
  if (isCircle) {
    ctx.textAlign = "center";
    if (identity?.name) {
      drawNamePill(ctx, 0, by - u * 24, identity.name, u, "center", win.x + win.w / 2);
    } else {
      ctx.fillStyle = SUN;
      ctx.font = `600 ${u * 26}px ${FONT.mono()}`;
      ctx.fillText(`#${SHARE.hashtag}`, win.x + win.w / 2, by);
    }
  } else {
    if (identity?.name) {
      drawNamePill(ctx, win.x + pad, by - u * 26, identity.name, u, "left");
    } else {
      ctx.textAlign = "left";
      ctx.fillStyle = SUN;
      ctx.font = `700 ${u * 30}px ${FONT.display()}`;
      ctx.fillText("HACKER HOUSE GOA", win.x + pad, by);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,251,232,0.9)";
    ctx.font = `500 ${u * 22}px ${FONT.mono()}`;
    ctx.fillText(`GOA · ${EVENT.dates}`, win.x + win.w - pad, by);
  }
}

// ---------- badge mode (tall / arch) ----------

function composeBadge(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  k: number,
  win: Win,
  cfg: StyleConfig,
  photo: CanvasImageSource,
  photoSize: PhotoSize,
  placement: Placement,
  identity: Identity | undefined,
  shapeCfg: (typeof SHAPE)[FrameShape],
): void {
  const u = k;
  const m = W * 0.03;
  const cx = W / 2;

  drawGrid(ctx, m, m, W - m * 2, H - m * 2, u);
  pinkBorderRect(ctx, m, m, W - m * 2, H - m * 2, W * 0.05, W);

  // title block above the photo
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = `800 ${u * 74}px ${FONT.display()}`;
  ctx.fillText("HH GOA 2026", cx, win.y - u * 66);
  ctx.fillStyle = PINK;
  ctx.font = `600 ${u * 24}px ${FONT.mono()}`;
  ctx.fillText(`BUILDER ID · #${SHARE.hashtag}`, cx, win.y - u * 30);

  // clean photo window
  ctx.save();
  windowPath(ctx, win);
  ctx.clip();
  const r = coverRectIn(win.x, win.y, win.w, win.h, photoSize, placement);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  ctx.restore();
  pinkBorderWindow(ctx, win, W);

  // cream name panel
  if (shapeCfg.panel) {
    const p = {
      x: shapeCfg.panel.x * k,
      y: shapeCfg.panel.y * k,
      w: shapeCfg.panel.w * k,
      h: shapeCfg.panel.h * k,
    };
    roundRectPath(ctx, p.x, p.y, p.w, p.h, u * 22);
    ctx.fillStyle = CREAM;
    ctx.fill();
    ctx.lineWidth = Math.max(1, u * 3.5);
    ctx.strokeStyle = PINK;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    if (identity?.name) {
      ctx.fillStyle = DEEP;
      ctx.font = `800 ${u * 62}px ${FONT.display()}`;
      ctx.fillText(truncate(identity.name, 18), p.x + p.w / 2, p.y + p.h * 0.44);
      if (identity.builderClass) {
        ctx.fillStyle = PINK;
        ctx.font = `600 ${u * 24}px ${FONT.mono()}`;
        ctx.fillText(
          `// ${identity.builderClass.toUpperCase()}`,
          p.x + p.w / 2,
          p.y + p.h * 0.66,
        );
      }
      ctx.fillStyle = GREEN;
      ctx.font = `500 ${u * 22}px ${FONT.mono()}`;
      ctx.fillText(
        `#${SHARE.hashtag} · ${EVENT.dates}`,
        p.x + p.w / 2,
        p.y + p.h * 0.86,
      );
    } else {
      ctx.fillStyle = DEEP;
      ctx.font = `800 ${u * 52}px ${FONT.display()}`;
      ctx.fillText("HACKER HOUSE GOA", p.x + p.w / 2, p.y + p.h * 0.48);
      ctx.fillStyle = GREEN;
      ctx.font = `500 ${u * 22}px ${FONT.mono()}`;
      ctx.fillText(
        `#${SHARE.hashtag} · ${EVENT.dates}`,
        p.x + p.w / 2,
        p.y + p.h * 0.76,
      );
    }
  }

  drawStamp(ctx, W - m - W * 0.02 - u * 150, m + W * 0.055, u, SUN);
}

// ---------- ticket / boarding-pass ID ----------

function drawWordmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  size: number,
  accent: string,
): void {
  const disp = FONT.display();
  const deva = FONT.deva();
  const gap = size * 0.14;
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 ${size}px ${disp}`;
  const w1 = ctx.measureText("HACKER").width;
  const w3 = ctx.measureText("HOUSE").width;
  ctx.font = `800 ${size * 0.64}px ${deva}`;
  const wd = ctx.measureText("गोवा").width;
  const total = w1 + gap + wd + gap + w3;
  let x = cx - total / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = `800 ${size}px ${disp}`;
  ctx.fillText("HACKER", x, baseY);
  x += w1 + gap;
  ctx.font = `800 ${size * 0.64}px ${deva}`;
  ctx.lineJoin = "round";
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = size * 0.05;
  ctx.strokeText("गोवा", x, baseY - size * 0.02);
  ctx.fillStyle = PINK;
  ctx.fillText("गोवा", x, baseY - size * 0.02);
  x += wd + gap;
  ctx.fillStyle = accent;
  ctx.font = `800 ${size}px ${disp}`;
  ctx.fillText("HOUSE", x, baseY);
  ctx.textAlign = "center";
}

function drawQR(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  box: number,
  m: QRMatrix,
): void {
  roundRectPath(ctx, x, y, box, box, box * 0.06);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const pad = box * 0.09;
  const cell = (box - pad * 2) / m.size;
  ctx.fillStyle = DEEP;
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (m.get(r, c)) {
        ctx.fillRect(x + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }
}

/** Pink lanyard clip flaring from the top edge into a punched hole. */
function drawLanyard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topM: number,
  u: number,
  bg: string,
): void {
  const holeY = topM + u * 92;
  const holeR = u * 26;
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.moveTo(cx - u * 14, topM - u * 2);
  ctx.lineTo(cx + u * 14, topM - u * 2);
  ctx.lineTo(cx + u * 48, holeY + u * 8);
  ctx.lineTo(cx - u * 48, holeY + u * 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, holeY, holeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1, u * 3);
  ctx.strokeStyle = "rgba(10,42,24,0.55)";
  ctx.stroke();
}

function drawQRPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  box: number,
  u: number,
): void {
  ctx.save();
  ctx.setLineDash([u * 9, u * 7]);
  ctx.lineWidth = Math.max(1, u * 3);
  ctx.strokeStyle = "rgba(255,251,232,0.35)";
  roundRectPath(ctx, x, y, box, box, box * 0.06);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,251,232,0.5)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${u * 20}px ${FONT.mono()}`;
  ctx.fillText("QR", x + box / 2, y + box / 2 - u * 10);
  ctx.font = `500 ${u * 15}px ${FONT.mono()}`;
  ctx.fillText("tap Generate", x + box / 2, y + box / 2 + u * 16);
  ctx.restore();
}

function drawStyleMotif(
  ctx: CanvasRenderingContext2D,
  W: number,
  u: number,
  cfg: StyleConfig,
): void {
  const y = u * 232;
  const lx = W * 0.15;
  const rx = W * 0.85;
  if (cfg.label === "Midnight") {
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(lx, y, u * 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#06231c";
    ctx.beginPath();
    ctx.arc(lx - u * 9, y - u * 4, u * 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,251,232,0.9)";
    for (const [dx, dy, rr] of [
      [0, -u * 26, u * 3],
      [u * 24, -u * 2, u * 2.4],
      [-u * 20, u * 16, u * 2.2],
    ]) {
      ctx.beginPath();
      ctx.arc(rx + dx, y + dy, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (cfg.label === "Palm") {
    palm(ctx, lx, y + u * 40, u * 74, false, cfg.accent);
    palm(ctx, rx, y + u * 40, u * 74, true, cfg.accent);
  } else {
    drawSmallSun(ctx, lx, y, u * 22);
    drawSmallSun(ctx, rx, y, u * 22);
  }
}

function composeTicket(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  k: number,
  win: Win,
  cfg: StyleConfig,
  photo: CanvasImageSource,
  photoSize: PhotoSize,
  placement: Placement,
  identity: Identity | undefined,
  finalized: boolean,
): void {
  const u = k;
  const m = W * 0.03;
  const cx = W / 2;
  const bg =
    cfg.label === "Midnight" ? "#06231c" : cfg.label === "Palm" ? "#0c7a45" : GREEN;

  if (bg !== GREEN) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }
  drawGrid(ctx, m, m, W - m * 2, H - m * 2, u);
  drawLanyard(ctx, cx, m, u, bg);
  drawStyleMotif(ctx, W, u, cfg);

  // header
  drawWordmark(ctx, cx, u * 250, u * 52, cfg.accent);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PINK;
  ctx.font = `600 ${u * 22}px ${FONT.mono()}`;
  ctx.fillText(`BUILDER PASS · #${SHARE.hashtag}`, cx, u * 292);

  // photo window
  ctx.save();
  roundRectPath(ctx, win.x, win.y, win.w, win.h, win.radius);
  ctx.clip();
  const r = coverRectIn(win.x, win.y, win.w, win.h, photoSize, placement);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  ctx.restore();
  roundRectPath(ctx, win.x, win.y, win.w, win.h, win.radius);
  ctx.lineWidth = W * 0.012;
  ctx.strokeStyle = PINK;
  ctx.stroke();

  // name ribbon
  const p = { x: u * 70, y: u * 912, w: u * 860, h: u * 138 };
  roundRectPath(ctx, p.x, p.y, p.w, p.h, u * 22);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = Math.max(1, u * 3.5);
  ctx.strokeStyle = PINK;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = DEEP;
  ctx.font = `800 ${u * 54}px ${FONT.display()}`;
  ctx.fillText(truncate(identity?.name || "BUILDER", 18), cx, p.y + p.h * 0.5);
  ctx.fillStyle = PINK;
  ctx.font = `600 ${u * 23}px ${FONT.mono()}`;
  ctx.fillText(
    identity?.builderClass
      ? `// ${identity.builderClass.toUpperCase()}`
      : identity?.handle
        ? `@${identity.handle.replace(/^@/, "")}`
        : "HH GOA 2026",
    cx,
    p.y + p.h * 0.82,
  );

  // QR (centered) — gated behind Generate
  const qbox = u * 250;
  const qx = cx - qbox / 2;
  const qy = u * 1088;
  if (finalized) {
    drawQR(ctx, qx, qy, qbox, makeQR(metadataText(identity)));
    ctx.fillStyle = "rgba(255,251,232,0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${u * 18}px ${FONT.mono()}`;
    ctx.fillText("SCAN FOR DETAILS", cx, qy + qbox + u * 30);
  } else {
    drawQRPlaceholder(ctx, qx, qy, qbox, u);
  }

  // footer
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,251,232,0.8)";
  ctx.font = `500 ${u * 20}px ${FONT.mono()}`;
  ctx.fillText(`${EVENT.dates} · ${EVENT.location}`, cx, H - m - u * 54);
  ctx.fillStyle = cfg.accent;
  ctx.font = `700 ${u * 22}px ${FONT.mono()}`;
  ctx.fillText("2:47 PM STUDIO", cx, H - m - u * 22);

  pinkBorderRect(ctx, m, m, W - m * 2, H - m * 2, W * 0.045, W);
}

/** The back of the card: big scannable QR + the builder's details. */
export function composeCardBack(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  identity: Identity | undefined,
  style: FrameStyle = "sunset",
  finalized = true,
): void {
  const cfg = STYLE[style];
  const S = Math.min(W, H);
  const u = S / 1000;
  const m = S * 0.04;
  const cx = W / 2;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle =
    cfg.label === "Midnight" ? "#06231c" : cfg.label === "Palm" ? "#0c7a45" : GREEN;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawGrid(ctx, m, m, W - m * 2, H - m * 2, u);

  drawWordmark(ctx, cx, m + u * 80, u * 54, cfg.accent);
  ctx.textAlign = "center";
  ctx.fillStyle = PINK;
  ctx.font = `600 ${u * 24}px ${FONT.mono()}`;
  ctx.fillText("BUILDER PASS", cx, m + u * 120);

  const qbox = Math.min(W * 0.62, H * 0.42);
  const qx = cx - qbox / 2;
  const qy = H * 0.3;
  if (finalized) {
    drawQR(ctx, qx, qy, qbox, makeQR(metadataText(identity)));
    ctx.fillStyle = CREAM;
    ctx.textAlign = "center";
    ctx.font = `600 ${u * 24}px ${FONT.mono()}`;
    ctx.fillText("SCAN FOR DETAILS", cx, qy + qbox + u * 46);
  } else {
    drawQRPlaceholder(ctx, qx, qy, qbox, u);
  }

  ctx.fillStyle = cfg.accent;
  ctx.font = `800 ${u * 54}px ${FONT.display()}`;
  ctx.fillText(truncate(identity?.name || "BUILDER", 18), cx, qy + qbox + u * 116);
  if (identity?.builderClass) {
    ctx.fillStyle = PINK;
    ctx.font = `600 ${u * 24}px ${FONT.mono()}`;
    ctx.fillText(`// ${identity.builderClass.toUpperCase()}`, cx, qy + qbox + u * 156);
  }

  ctx.fillStyle = "rgba(255,251,232,0.8)";
  ctx.font = `500 ${u * 20}px ${FONT.mono()}`;
  ctx.fillText(`${EVENT.dates} · ${EVENT.location}`, cx, H - m - u * 54);
  ctx.fillStyle = cfg.accent;
  ctx.font = `700 ${u * 22}px ${FONT.mono()}`;
  ctx.fillText(`2:47 PM STUDIO · #${SHARE.hashtag}`, cx, H - m - u * 22);

  pinkBorderRect(ctx, m, m, W - m * 2, H - m * 2, S * 0.05, S);
}

// ---------- image template overlay ----------

function composeOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  photo: CanvasImageSource,
  photoSize: PhotoSize,
  placement: Placement,
  ov: OverlaySpec,
): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const win = {
    x: ov.window.x * W,
    y: ov.window.y * H,
    w: ov.window.w * W,
    h: ov.window.h * H,
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x, win.y, win.w, win.h);
  ctx.clip();
  const r = coverRectIn(win.x, win.y, win.w, win.h, photoSize, placement);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  ctx.restore();
  ctx.drawImage(ov.img, 0, 0, W, H);
}

// ---------- team / combined frame ----------

export type TeamPhoto = { photo: CanvasImageSource; size: PhotoSize };
export type TeamMember = { photo: CanvasImageSource; size: PhotoSize; name?: string };
export type TeamComposeInput = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  members: TeamMember[];
  style?: FrameStyle;
  teamName?: string;
};

function teamCells(
  x: number,
  y: number,
  w: number,
  h: number,
  n: number,
): number[][] {
  const g = Math.min(w, h) * 0.035;
  if (n <= 1) return [[x, y, w, h]];
  if (n === 2) {
    const cw = (w - g) / 2;
    return [
      [x, y, cw, h],
      [x + cw + g, y, cw, h],
    ];
  }
  if (n === 3) {
    const cw = (w - g) / 2;
    const ch = (h - g) / 2;
    return [
      [x, y, cw, ch],
      [x + cw + g, y, cw, ch],
      [x, y + ch + g, w, ch],
    ];
  }
  const cw = (w - g) / 2;
  const ch = (h - g) / 2;
  return [
    [x, y, cw, ch],
    [x + cw + g, y, cw, ch],
    [x, y + ch + g, cw, ch],
    [x + cw + g, y + ch + g, cw, ch],
  ];
}

export function composeTeam(input: TeamComposeInput): void {
  const { ctx, w: W, h: H, members, teamName } = input;
  const u = W / 1200;
  const m = W * 0.03;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawGrid(ctx, m, m, W - m * 2, H - m * 2, u);

  // title
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = `800 ${u * 68}px ${FONT.display()}`;
  ctx.fillText("HH GOA 2026", cx, H * 0.1);
  ctx.fillStyle = PINK;
  ctx.font = `600 ${u * 24}px ${FONT.mono()}`;
  ctx.fillText("ONE FRAME, WHOLE CREW", cx, H * 0.13);

  // grid of photos with name tags
  const gx = m + W * 0.03;
  const gyTop = H * 0.17;
  const gw = W - gx * 2;
  const gh = H * 0.66 - gyTop;
  const n = Math.max(1, Math.min(4, members.length));
  const rects = teamCells(gx, gyTop, gw, gh, n);
  for (let i = 0; i < n; i++) {
    const [rx, ry, rw, rh] = rects[i];
    ctx.save();
    roundRectPath(ctx, rx, ry, rw, rh, W * 0.022);
    ctx.clip();
    const rr = coverRectIn(rx, ry, rw, rh, members[i].size, {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
    ctx.drawImage(members[i].photo, rr.x, rr.y, rr.w, rr.h);
    ctx.restore();
    roundRectPath(ctx, rx, ry, rw, rh, W * 0.022);
    ctx.lineWidth = W * 0.007;
    ctx.strokeStyle = PINK;
    ctx.stroke();
    const nm = members[i].name?.trim();
    if (nm) {
      drawNamePill(ctx, 0, ry + rh - u * 34, nm, u, "center", rx + rw / 2);
    }
  }

  // bottom meta
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = `800 ${u * 46}px ${FONT.display()}`;
  ctx.fillText(truncate(teamName?.trim() || "THE CREW", 22), cx, H * 0.87);
  ctx.fillStyle = SUN;
  ctx.font = `600 ${u * 26}px ${FONT.mono()}`;
  ctx.fillText(`#${SHARE.hashtag}`, cx, H * 0.91);
  ctx.fillStyle = "rgba(255,251,232,0.8)";
  ctx.font = `500 ${u * 20}px ${FONT.mono()}`;
  ctx.fillText(`${EVENT.dates} · ${EVENT.location}`, cx, H * 0.94);

  pinkBorderRect(ctx, m, m, W - m * 2, H - m * 2, W * 0.045, W);
  drawStamp(ctx, W - m - W * 0.02 - u * 150, m + W * 0.05, u, SUN);
}
