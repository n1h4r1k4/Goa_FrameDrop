---
name: hhgoa-brand
description: HH Goa 2026 design system — color palette, fonts (Imbue + Victor Mono + Devanagari), voice/tagline, sunset motifs, event heritage facts, official links, and asset inventory. Use when building or reviewing ANY UI, theme, copy, or exported-image styling for the HH Goa Frame Generator so it stays unmistakably on-brand with hhgoa.com.
---

# HH Goa 2026 — Brand System

The Frame Generator is a faithful extension of **hhgoa.com**. Retro-tropical-hacker: deep Goa green, a line-art sunset, giant display serif + hacker monospace, bilingual English/Hindi. Single source of truth in code: `src/lib/brand.ts` (mirror any change here into that file and `globals.css @theme`).

## Palette (hex ↔ CSS var ↔ use)
| Token | Hex | CSS var / util | Use |
|---|---|---|---|
| Goa green | `#0b6839` | `--color-goa-green` / `bg-goa-green` | primary background |
| Green deep (ink) | `#0a2a18` | `--color-goa-green-deep` | shadows, ink text on light |
| Sun 1 | `#fee101` | `--color-sun-1` | primary yellow (headlines, sun core) |
| Sun 2 | `#edd723` | `--color-sun-2` | mid gradient |
| Sun 3 | `#f9dc01` | `--color-sun-3` | gradient / rays |
| Cream | `#fffbe8` | `--color-cream` | body text on green, panels |
| Goa red | `#e2231a` | `--color-goa-red` | गोवा, accents ONLY (sparingly) |
| White | `#ffffff` | — | high-contrast text |

Default page = green bg + cream text. Yellow is the hero/accent color; red is reserved for गोवा and tiny accents. Never a generic white card on white — keep it green/cream/sun.

## Typography
- **Imbue** (display serif, variable) → `font-display` / `var(--font-imbue)`. Oversized headings only: "HACKER HOUSE", section titles. Very tall/dramatic; use large sizes (clamp) and tight leading. Uppercase for the hero.
- **Victor Mono** (hacker monospace) → `font-mono` / `var(--font-victor-mono)`. Labels, buttons, metadata, the "GOA, INDIA · 28–31 OCT 2026" strip, captions. Its cursive italic is great for small flourishes.
- **Devanagari** (`--font-deva`) → the गोवा wordmark (bold, red). Only for Hindi glyphs.
- Before ANY canvas export, `await document.fonts.ready` so the PNG uses the real faces, not fallbacks.

## Voice & copy
- Tagline: **"Less Noise. More Signal."** Terse, builder/terminal tone, lowercase-friendly, no corporate fluff.
- Default share caption: `Locked in for HH Goa 2026 🌴 building on the sand, 28–31 Oct. #FrameInGoa`
- Always end shareable copy with **#FrameInGoa**.

## Motifs (the sunset scene)
Sun with radiating rays low over an **ocean horizon** line; **palm-tree** silhouettes; small **Goan villa** line-art; bilingual **गोवा** in red overlapping "HACKER HOUSE". Line-art / poster-print feel; optional subtle grain. This scene is the hero AND the frame overlay AND the intro animation subject.

## Heritage
HHG'24 did **6,800+ registrations, 390+ hackers, 100 projects** — usable as social proof in copy. Do **not** put edition/lineage numbering ("5th edition", the city series) in UI, metadata, or the exported image; it was removed deliberately.

## Event facts
Goa, India · **28–31 Oct 2026** · 247/500 elite builders · 4-day builder residency · free (stay + meals). Organizer: **2:47 pm Studio**.

## Official links (use verbatim)
- Site: `https://hhgoa.com/`
- Apply (Devfolio): `https://hacker-house-goa-2026.devfolio.co/`
- Studio X: `https://x.com/247pmstudio` · Telegram: `https://t.me/twofourtysevenpm` · Email: `satapathyprayasu@gmail.com`
- Hashtag: `#FrameInGoa`

## Asset inventory
- `public/frame/frame-scene.svg` — editable sunset scene (source of truth)
- `public/frame/frame-overlay@2x.png` — transparent-center 2400² frame drawn onto the canvas
- `public/og/default-og.png` — 1200×630 branded fallback card
- `docs/reference/hhgoa_{desktop,mobile}_hero.png` — snapshots of the real site

## Do / Don't
- ✅ Green canvas, sun-yellow hero, cream text; mono for meta, serif for display.
- ✅ Keep गोवा red + Devanagari; keep the sunset scene present everywhere.
- ❌ No generic badge-on-white. ❌ Don't overuse red. ❌ Don't ship a screen without a sunset/tropical cue.
- Related skills: **hhgoa-motion** (animation), **frame-generator** (canvas), **share-og** (share).
