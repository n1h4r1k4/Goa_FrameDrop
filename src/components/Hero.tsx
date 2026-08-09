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
      {/* pathLength=1 normalises the dash units, so the intro can draw the
          stroke with a plain 1→0 dashoffset and never has to measure the
          path — which would be wrong the moment the viewBox stretches */}
      <path
        className="swoosh-path"
        d="M8 15C118 6 262 3 380 6c66 2 141 5 212 9"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
      />
    </svg>
  );
}

const chip =
  "rounded-full border-2 px-3.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] sm:text-[0.7rem]";

export default function Hero() {
  return (
    // the night-beach background image is the scene now — the hero just sets type on it
    <section className="relative isolate px-5 pb-10 pt-6 sm:pb-16 sm:pt-10">
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
          Frame your photo for four days on the sand, then post it with{" "}
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
