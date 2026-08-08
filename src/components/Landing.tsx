"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Hero from "./Hero";
import Generator from "./Generator";
import NoticeBoard from "./NoticeBoard";
import SideDecor from "./scene/SideDecor";

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
            gsap.set(
              [...revealed, ".sun", ".ray", ".palm", ".horizon", ".scene-el"],
              { autoAlpha: 1, clearProps: "transform" },
            );
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
            .from(
              [".scene-el", ".palm"],
              { y: 22, autoAlpha: 0, stagger: 0.05 },
              "<0.05",
            )
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
            // the pink underline draws itself in from the left
            .from(
              ".tagline",
              { autoAlpha: 0, scaleX: 0.2, transformOrigin: "0% 50%" },
              "-=0.3",
            )
            .from(".sub", { autoAlpha: 0, y: 10, stagger: 0.1 }, "<")
            .from(".tool", { autoAlpha: 0, y: 28, duration: 0.55 }, "-=0.1");
        },
      );
    },
    { scope: root },
  );

  return (
    <main ref={root} className="relative flex flex-1 flex-col">
      <SideDecor />
      <Hero />
      <div className="hh-tape" />
      <div className="tool">
        <Generator />
      </div>
      <NoticeBoard />
    </main>
  );
}
