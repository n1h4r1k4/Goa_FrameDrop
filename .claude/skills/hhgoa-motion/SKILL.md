---
name: hhgoa-motion
description: GSAP motion spec for the HH Goa Frame Generator — the signature "sun going down" sunset intro reveal, the useGSAP + gsap.matchMedia() reduced-motion pattern for React/Next.js, scoped selectors + auto cleanup, and the micro-interaction catalog. Use when building or reviewing ANY animation, transition, hover, or intro/reveal in this project.
---

# HH Goa — Motion (GSAP)

Motion is a **branded micro-interaction, never a loading gate**. The hero moment is a **sunset reveal** (the sun descends behind the horizon, the scene settles, the tool appears). Keep it ≤ ~1.2s and always honor reduced-motion.

## Setup (Next.js / React)
```ts
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP); // once
```
- All GSAP runs client-side only. Components using it are `"use client"`.
- Use **`useGSAP(() => {...}, { scope: ref })`** — scopes selectors to the component and auto-reverts on unmount. Never run selectors without a scope.
- Prefer transform aliases (`x,y,scale,rotation`) + **`autoAlpha`** (not `opacity`). Never animate layout props (width/height/top/left).

## The sunset intro timeline (`SunsetIntro.tsx`)
Single `gsap.timeline` wrapped in `gsap.matchMedia()`. Targets are SVG/DOM layers: `.sky`, `.sun`, `.ray` (×N), `.horizon`, `.palm` (×N), `.villa`, `.headline`, `.deva` (गोवा), `.tool`.

Beats (defaults `{ ease: "power3.out" }`):
1. **0.0** sky settles (`.sky` autoAlpha 1). Sun starts high & small above horizon.
2. **~0.1** `.sun` descends to the horizon: `y` down + `scale` up slightly, `ease:"sine.inOut"`, ~0.7s. Sky warms green→amber near horizon (animate a CSS var/gradient stop or a `.glow` autoAlpha).
3. **`"<0.15"`** `.ray` fan out: `scaleY/scale` from 0, `stagger:{each:0.04, from:"center"}`.
4. **`"<0.1"`** `.palm`/`.villa` settle up from baseline: `y:20→0`, `autoAlpha:0→1`, `stagger:0.06`.
5. **`"-=0.2"`** `.headline` (Imbue) + `.deva` (red गोवा) rise/fade in: `y`, `autoAlpha`, small `stagger`.
6. **`">-0.1"`** `.tool` (uploader) `autoAlpha:0→1`, `y:24→0` → interactive.

```ts
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add({ animate: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
    const { reduce } = ctx.conditions!;
    if (reduce) {                       // instant end-state, no motion
      gsap.set([".sun",".ray",".palm",".villa",".headline",".deva",".tool"], { clearProps: "all", autoAlpha: 1 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.6 } });
    tl.from(".sun", { y: -80, scale: 0.6, ease: "sine.inOut", duration: 0.7 })
      .from(".ray", { scale: 0, transformOrigin: "50% 50%", stagger: { each: 0.04, from: "center" } }, "<0.15")
      .from([".palm",".villa"], { y: 20, autoAlpha: 0, stagger: 0.06 }, "<0.1")
      .from([".headline",".deva"], { y: 30, autoAlpha: 0, stagger: 0.08 }, "-=0.2")
      .from(".tool", { y: 24, autoAlpha: 0, duration: 0.5 }, ">-0.1");
    return () => tl.kill();
  });
}, { scope: containerRef });
```
- The intro must NOT block interaction longer than ~1.2s; the uploader can already accept a drop underneath.
- Run once per mount (don't replay on every state change).

## Micro-interaction catalog (all reduced-motion aware)
- **Buttons:** press `scale:0.96` (`power2.out`, 0.12s); hover subtle `y:-2`.
- **Photo drop-in:** when a photo loads, `scale:1.04→1` + `autoAlpha` on the canvas, ~0.4s (a "settles into the frame" beat).
- **Download success:** quick sun-yellow pulse (`scale` or a ring `scale+autoAlpha`).
- **Share:** brief ripple/checkmark; on Web Share cancel do nothing.
- **Sun idle (optional):** very slow infinite ray shimmer (`repeat:-1, yoyo`) at low amplitude; disable under reduce.

## Perf & cleanup
- One timeline over many delayed tweens; use the position parameter.
- `will-change` only on actively-animating elements; let GSAP manage transforms.
- `useGSAP` handles revert; for handlers created later use the hook's `contextSafe`.
- Wrap responsive/reduced-motion branches in `gsap.matchMedia()` (auto-reverts); do not nest `gsap.context()` inside it.

Related: **hhgoa-brand** (what to style), **frame-generator** (canvas), and the installed `gsap-*` skills for API depth.
