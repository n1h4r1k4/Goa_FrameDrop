"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "./Hero";
import Generator from "./Generator";
import NoticeBoard from "./NoticeBoard";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Everything the intro hides up front, so reduced-motion can show it at once. */
const HIDDEN = [".hk-line", ".deva", ".sub", ".tool"];

export default function Landing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          ok: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          if (ctx.conditions?.reduce) {
            gsap.set(HIDDEN, { autoAlpha: 1, clearProps: "transform" });
            gsap.set(".swoosh-path", { strokeDashoffset: 0 });
            return;
          }

          // hold the stroke back before first paint — a fromTo scheduled later
          // in the timeline would otherwise flash the finished swoosh
          gsap.set(".swoosh-path", { strokeDashoffset: 1 });

          const tl = gsap.timeline({
            defaults: { ease: "power3.out", duration: 0.6 },
          });

          tl
            // the wordmark wipes up from its own baseline rather than fading:
            // clipPath is cleared afterwards so descenders aren't left cropped
            .fromTo(
              ".hk-line:not(.deva)",
              { clipPath: "inset(0% 0% 100% 0%)", yPercent: 26, autoAlpha: 0 },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                yPercent: 0,
                autoAlpha: 1,
                duration: 0.85,
                ease: "expo.out",
                stagger: 0.14,
                clearProps: "clipPath",
              },
            )
            // गोवा is a sticker, so it lands like one — overshoot, not a fade.
            // Never split or clip this one: the matras are separate glyphs and
            // any per-character treatment breaks the shaping.
            .from(
              ".deva",
              {
                autoAlpha: 0,
                scale: 0.4,
                rotation: -12,
                transformOrigin: "50% 60%",
                ease: "back.out(2.4)",
                duration: 0.7,
              },
              "<0.28",
            )
            .to(
              ".swoosh-path",
              { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" },
              "-=0.34",
            )
            .from(".sub", { autoAlpha: 0, y: 12, stagger: 0.09 }, "-=0.5")
            .from(".tool", { autoAlpha: 0, y: 28, duration: 0.55 }, "-=0.3");

          // Everything below the fold arrives on scroll instead of being there
          // already. once:true — a section that re-hides on scroll-back reads
          // as a glitch, not as motion.
          const reveal = (
            targets: gsap.TweenTarget,
            trigger: Element,
            vars: gsap.TweenVars = {},
          ) =>
            gsap.from(targets, {
              y: 26,
              autoAlpha: 0,
              duration: 0.55,
              ease: "power3.out",
              scrollTrigger: { trigger, start: "top 88%", once: true },
              ...vars,
            });

          gsap.utils
            .toArray<HTMLElement>("[data-reveal]")
            .forEach((el) => reveal(el, el));

          gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((g) => {
            const kids = Array.from(g.children) as HTMLElement[];
            if (kids.length) reveal(kids, g, { y: 22, stagger: 0.07 });
          });

          // Imbue and Victor Mono land after first paint and reflow the page,
          // which leaves every trigger measured against the old layout — far
          // enough off that a section can scroll past without ever firing and
          // stay stuck at autoAlpha 0. Re-measure once the faces are in.
          document.fonts?.ready.then(() => ScrollTrigger.refresh());
        },
      );
    },
    { scope: root },
  );

  return (
    <main ref={root} className="relative flex flex-1 flex-col">
      <Hero />
      <div className="hh-tape" />
      <div className="tool">
        <Generator />
      </div>
      <NoticeBoard />
    </main>
  );
}
