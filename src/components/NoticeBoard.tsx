import { EVENT, LINKS, SHARE } from "@/lib/brand";

const FAQ: { q: string; a: string }[] = [
  {
    q: `How do I share my pass with #${SHARE.hashtag}?`,
    a: "Hit Share to X. On a phone the real PNG is attached to the post; on desktop you get a link whose preview image is the pass itself. The caption and hashtag are pre-filled.",
  },
  {
    q: "Where does my photo go?",
    a: "Nowhere. Everything is composited on a canvas in your own browser, so the download is instant and works offline. A copy only leaves the device if you use desktop Share, which needs a hosted image for the link preview.",
  },
  {
    q: "Can I make one for my whole team?",
    a: "Yes — switch to Crew. Drop in up to four photos (or one group shot), name the crew, and you get a single squad pass.",
  },
  {
    q: `What is ${EVENT.shortName}?`,
    a: `A four-day builder residency on the sand in Goa, ${EVENT.dates} — ${EVENT.descriptor}, free to attend, stay and meals covered. ${EVENT.tagline}`,
  },
];

export default function NoticeBoard() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <h2
        className="hh-h text-center text-sun-1"
        style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)" }}
      >
        Notice board
      </h2>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
        {FAQ.map(({ q, a }) => (
          // the pin lives outside <details>: anything in there that isn't the
          // <summary> is hidden while the card is closed
          <div key={q} className="relative">
            <span className="hh-pin" aria-hidden />
            <details className="hh-panel group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-mono text-sm font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="shrink-0 text-xl leading-none text-pink-hot transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 border-t-2 border-ink/15 pt-3 font-mono text-xs leading-relaxed text-ink/75">
                {a}
              </p>
            </details>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center font-mono text-xs text-cream/60">
        Applications for the residency are open at{" "}
        <a
          href={LINKS.apply}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-sun-1 underline underline-offset-4"
        >
          devfolio
        </a>
        .
      </p>
    </section>
  );
}
