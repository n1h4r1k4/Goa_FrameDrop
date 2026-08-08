"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Generator from "./Generator";
import SunsetSVG from "./scene/SunsetSVG";
import { EVENT, WORDMARK, SHARE } from "@/lib/brand";

gsap.registerPlugin(useGSAP);

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
          const revealed = [".hk-line", ".deva", ".tagline", ".sub", ".tool"];
          if (ctx.conditions?.reduce) {
            gsap.set([...revealed, ".sun", ".ray", ".palm", ".horizon"], {
              autoAlpha: 1,
              clearProps: "transform",
            });
            return;
          }
          const tl = gsap.timeline({
            defaults: { ease: "power3.out", duration: 0.6 },
          });
          tl.from(".sun", {
            y: -90,
            autoAlpha: 0,
            ease: "sine.inOut",
            duration: 0.9,
          })
            .from(
              ".ray",
              {
                scale: 0,
                svgOrigin: "180 120",
                stagger: { each: 0.04, from: "center" },
              },
              "<0.3",
            )
            .from(
              ".horizon",
              { scaleX: 0, svgOrigin: "180 120", duration: 0.5 },
              "<",
            )
            .from(".palm", { y: 28, autoAlpha: 0, stagger: 0.12 }, "<0.05")
            .from(
              ".hk-line",
              { y: 48, autoAlpha: 0, stagger: 0.12, duration: 0.7 },
              "-=0.35",
            )
            .from(
              ".deva",
              { autoAlpha: 0, scale: 0.5, transformOrigin: "50% 50%" },
              "<0.15",
            )
            .from(".sub", { autoAlpha: 0, y: 10, stagger: 0.1 }, "-=0.25")
            .from(".tagline", { autoAlpha: 0, y: 10 }, "<")
            .from(".tool", { autoAlpha: 0, y: 28, duration: 0.55 }, "-=0.1");
        },
      );
    },
    { scope: root },
  );

  return (
    <main
      ref={root}
      className="relative flex flex-1 flex-col items-center px-5 py-8 sm:py-10"
    >
      <p className="sub mb-4 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-cream/70">
        {EVENT.location} · {EVENT.dates}
      </p>

      <h1
        className="text-center font-display font-black uppercase leading-[0.78] text-sun-1"
        style={{ fontSize: "clamp(2.75rem, 12vw, 6.5rem)" }}
      >
        <span className="hk-line block">{WORDMARK.line1}</span>
        <span className="hk-line relative block">
          {WORDMARK.line2}
          <span
            className="deva pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-deva text-goa-red"
            style={{ fontSize: "0.42em" }}
          >
            {WORDMARK.deva}
          </span>
        </span>
      </h1>

      <div className="pointer-events-none mt-1 w-full max-w-md">
        <SunsetSVG className="w-full" />
      </div>

      <p className="tagline mt-3 font-mono text-sm text-cream/80">
        {EVENT.tagline}
      </p>
      <p className="sub mt-2 max-w-sm text-center font-mono text-xs text-cream/55">
        Frame your photo for the 5th edition on the sand — share it with{" "}
        <span className="text-sun-1">#{SHARE.hashtag}</span>.
      </p>

      <div className="tool w-full">
        <Generator />
      </div>
    </main>
  );
}
