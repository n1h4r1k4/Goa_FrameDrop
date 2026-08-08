---
name: share-og
description: Share-to-X + Open Graph flow for the HH Goa Frame Generator — Web Share API Level 2 (attach real PNG on mobile) with the synchronous-tap rule, Vercel Blob public client-upload, share-id = base64url(blob pathname) with no datastore, the /s/[id] generateMetadata that points og/twitter:image at the public Blob PNG so X previews the real graphic, X web-intent URL building, and cache-busting. Use when building or reviewing sharing, upload, or link-preview code.
---

# HH Goa — Share to X + OG

Goal (from the task): Share opens a pre-filled tweet with **#FrameInGoa**, and the link preview (OG image) shows the **actual generated graphic**, not a blank/default.

## Strategy
- **Mobile / file-share capable:** attach the real PNG to the X app via Web Share API (best UX, no upload).
- **Desktop / no file-share (incl. all Firefox):** upload PNG → public Blob → open X intent with a `/s/[id]` link whose OG image IS that PNG.

## Web Share L2 (`lib/share/webshare.ts`) — the synchronous-tap rule
```ts
export async function shareImage(blob: Blob, text: string): Promise<"shared"|"unsupported"|"cancelled"> {
  const file = new File([blob], "hh-goa-2026.png", { type: "image/png" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: "HH Goa 2026" }); return "shared"; }
    catch (e: any) { if (e?.name === "AbortError") return "cancelled"; return "unsupported"; }
  }
  return "unsupported";
}
```
- **Generate the PNG BEFORE the tap, or call `share()` synchronously in the handler** — awaiting a long op first loses the transient user activation and `share()` throws.
- Secure context only (HTTPS). `AbortError` = user cancelled → do nothing.

## Blob upload (`lib/blob/client.ts` + `app/api/upload/route.ts`)
Client (bypasses the 4.5MB serverless body limit — phone photos are big):
```ts
import { upload } from "@vercel/blob/client";
const { url, pathname } = await upload(`frames/${id}.png`, blob, {
  access: "public",                    // MUST be public so X's crawler can fetch it
  handleUploadUrl: "/api/upload",
  contentType: "image/png",
});
```
Route handler (`handleUpload`): since there's **no login**, enforce abuse guards in `onBeforeGenerateToken`:
```ts
onBeforeGenerateToken: async () => ({
  allowedContentTypes: ["image/png"],
  maximumSizeInBytes: 5_000_000,
  addRandomSuffix: true,
})
```
- Do NOT depend on `onUploadCompleted` (doesn't fire on localhost). The browser gets `url` back from `upload()` directly.
- Env: `BLOB_READ_WRITE_TOKEN` (from `vercel env pull`). Add light IP rate-limiting if abused.

## Share id — no datastore
`id = base64url(blobPathname)`. `/s/[id]` decodes it back to the public Blob URL — no KV/DB needed. A fresh id per share also busts X's ~7-day card cache.

## /s/[id] link preview (`app/s/[id]/page.tsx`)
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const imageUrl = blobUrlFromId(params.id);   // public PNG on Blob
  return {
    title: "I'm going to HH Goa 2026 — #FrameInGoa",
    openGraph: { images: [{ url: imageUrl, width: 1200, height: 1200, type: "image/png" }], url: `/s/${params.id}` },
    twitter: { card: "summary_large_image", images: [imageUrl], site: "@247pmstudio" },
  };
}
```
Required tags: **`twitter:card=summary_large_image`**, `og:image`/`twitter:image` = the **public PNG** (never SVG — X won't render SVG), `og:image:width/height/type`, `og:url`. The page body also shows the graphic + a "Make your own #FrameInGoa" CTA linking home.

## X intent (`lib/share/intent.ts`)
```ts
export const tweetUrl = (shareUrl: string, caption = "Locked in for HH Goa 2026 🌴 building on the sand, 28–31 Oct.") =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&hashtags=FrameInGoa&url=${encodeURIComponent(shareUrl)}`;
```
Keep caption + URL under 280 chars. Open in a new tab.

## Do / Don't
- ✅ OG image = **public Blob PNG**. ✅ Feature-detect `canShare({files})`. ✅ Fresh id per share. ✅ PNG-only + size cap on upload.
- ❌ Don't route the user's photo composite through `next/og`/Satori (can't reproduce a photo; flexbox-only). ❌ Don't await before `navigator.share()`. ❌ Don't make the Blob private.
- Related: **frame-generator** (produces the PNG), **hhgoa-brand** (caption voice).
