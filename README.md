# HH Goa 2026 — Frame / ID Card Generator

Upload a photo → get an unmistakable **HH Goa 2026** profile frame → download it or share to X with **#FrameInGoa**. Built for the HH Goa 2026 shortlisting task (Format A: PFP frame / overlay).

**Live:** https://goa-framedrop.vercel.app

## Features

- **Client-side, near-instant** compositing — no server round-trip to generate the image.
- **Real photos:** jpg / png / **HEIC** (iPhone), any aspect ratio. Drag to reposition, pinch / scroll to zoom (WYSIWYG — the preview equals the export).
- **Retina PNG export**, guarded against the iOS canvas size cap (no black images).
- **Share to X:** native file share on mobile (attaches the real PNG); on desktop, a Blob-hosted `/s/[id]` link whose **OG image is the actual graphic**, so the tweet preview shows it. Pre-filled caption + `#FrameInGoa`.
- **Signature GSAP "sun going down" intro** that reveals the tool (respects `prefers-reduced-motion`).
- **On-brand with [hhgoa.com](https://hhgoa.com/):** Imbue + Victor Mono, Goa green + sun-yellow, bilingual गोवा, line-art sunset scene.
- Optional **name / handle** + an auto-generated **builder class**.

## Tech

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · GSAP (`@gsap/react`) · `heic-to` · Vercel Blob.

## Local development

```bash
npm install
npm run dev
```

For the desktop Share link locally, link the project and pull the Blob token:

```bash
vercel link && vercel env pull .env.local
```

## Deploy (Vercel)

1. Import this repo at **vercel.com/new** — it auto-deploys on every push to `main`.
2. **Storage → Create → Blob** — Vercel injects `BLOB_READ_WRITE_TOKEN` into the project.
3. (Optional) set `NEXT_PUBLIC_SITE_URL` to your domain (otherwise the Vercel production URL is used automatically).

## How it works

- The photo is composited entirely on a `<canvas>` (`src/lib/canvas`), so download is instant and offline.
- Share id = base64url of the public Blob URL (host-validated) → `/s/[id]` sets the OG image with no datastore.
- Design / motion / canvas / share decisions are documented as project skills in `.claude/skills/`.

Made for HH Goa 2026 · 2:47 pm Studio · `#FrameInGoa`
