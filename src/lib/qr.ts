/**
 * QR helper — a synchronous QR matrix (drawn on canvas) that encodes the builder's
 * filled details so anyone can scan the badge and read the metadata.
 */
import QRCode from "qrcode";
import { EVENT, SHARE } from "@/lib/brand";
import type { Identity } from "@/lib/canvas/compose";

export type QRMatrix = { size: number; get: (r: number, c: number) => boolean };

export function makeQR(text: string): QRMatrix {
  const qr = QRCode.create(text || "HH GOA 2026", { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data as unknown as Uint8Array;
  return { size, get: (r, c) => !!data[r * size + c] };
}

/** Human-readable details encoded into the QR. */
export function metadataText(identity?: Identity, label = "BUILDER PASS"): string {
  return [
    `HACKER HOUSE GOA 2026 · ${label}`,
    identity?.name ? `Name: ${identity.name}` : null,
    identity?.handle ? `X: @${identity.handle.replace(/^@/, "")}` : null,
    identity?.builderClass ? `Class: ${identity.builderClass}` : null,
    identity?.stack ? `Stack: ${identity.stack}` : null,
    `${EVENT.dates} · ${EVENT.location}`,
    `#${SHARE.hashtag}`,
  ]
    .filter(Boolean)
    .join("\n");
}
