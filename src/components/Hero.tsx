import SunsetSVG from "./scene/SunsetSVG";
import { EVENT, WORDMARK, SHARE } from "@/lib/brand";

/** Hand-drawn pink underline that sits beneath the wordmark. */
function Swoosh() {
  return (
    <svg
      viewBox="0 0 600 22"
      className="w-full text-pink-hot"
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
    >
      <path
        d="M8 15C118 6 262 3 380 6c66 2 141 5 212 9"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const chip =
  "rounded-full border-2 px-3.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] sm:text-[0.7rem]";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-10 pt-4 sm:pb-14">
      {/* the beach itself — a wide band behind the type */}
      <div className="hh-scene-fade pointer-events-none absolute inset-x-0 bottom-0 -z-10 opacity-25">
        <SunsetSVG
          className="h-[42vh] max-h-[380px] min-h-[220px] w-full"
          preserveAspectRatio="xMidYMax slice"
        />
      </div>
      {/* the big low sun, cropped by the left edge (desktop only — on a phone
          there is no margin for it to sit in) */}
      <div
        aria-hidden
        className="sun pointer-events-none absolute bottom-[8%] left-[-2.5rem] -z-10 hidden h-36 w-36 rounded-full border-[3px] border-ink bg-sun-1 shadow-[0_0_90px_28px_rgba(254,225,1,0.28)] sm:block"
      />

      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <div className="sub mb-6 flex flex-wrap items-center justify-center gap-2">
          <span className={`${chip} border-ink bg-pink-hot text-white`}>
            Builder pass generator
          </span>
          <span className={`${chip} border-sun-1 text-sun-1`}>
            🌴 {EVENT.shortName}
          </span>
        </div>

        <h1
          className="hh-h flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sun-1"
          style={{ fontSize: "clamp(3.2rem, 15vw, 9.5rem)" }}
        >
          <span className="hk-line">{WORDMARK.line1}</span>
          <span
            className="hk-line deva deva-sticker font-deva leading-none"
            style={{ fontSize: "0.42em" }}
          >
            {WORDMARK.deva}
          </span>
          <span className="hk-line">{WORDMARK.line2}</span>
        </h1>

        <div className="tagline -mt-1 w-full max-w-3xl px-4">
          <Swoosh />
        </div>

        <div className="sub mt-5 flex flex-wrap items-center justify-center gap-3">
          <span
            className={`${chip} border-sun-1 text-sun-1`}
          >{`${EVENT.location} · ${EVENT.dates}`}</span>
          <span className="font-mono text-sm italic text-cream/85">
            {EVENT.tagline}
          </span>
        </div>

        <p className="sub mt-4 max-w-md text-center font-mono text-xs leading-relaxed text-cream/65">
          Frame your photo for the 5th edition on the sand, then post it with{" "}
          <span className="font-bold text-sun-1">#{SHARE.hashtag}</span>.
        </p>

        <a
          href="#generator"
          className="hh-btn mt-8 border-sun-1 bg-goa-green-deep text-sun-1"
        >
          ↓ Scroll to generator
        </a>
      </div>
    </section>
  );
}
