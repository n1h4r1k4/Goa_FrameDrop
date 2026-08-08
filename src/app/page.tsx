import { EVENT, WORDMARK } from "@/lib/brand";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      {/* location · date strip */}
      <p className="mb-8 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-cream/70">
        {EVENT.location} · {EVENT.dates}
      </p>

      {/* bilingual wordmark */}
      <h1
        className="text-center font-display font-black uppercase leading-[0.78] text-sun-1"
        style={{ fontSize: "clamp(3rem, 15vw, 11rem)" }}
      >
        <span className="block">{WORDMARK.line1}</span>
        <span className="relative block">
          {WORDMARK.line2}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-deva text-goa-red"
            style={{ fontSize: "0.42em" }}
          >
            {WORDMARK.deva}
          </span>
        </span>
      </h1>

      <p className="mt-8 font-mono text-sm text-cream/80">{EVENT.tagline}</p>

      {/* tool placeholder — replaced by the generator */}
      <div className="mt-12 rounded-2xl border border-cream/15 bg-goa-green-deep/40 px-8 py-10 text-center">
        <p className="font-mono text-sm text-cream/70">
          Frame generator — assembling on the sand…
        </p>
      </div>
    </main>
  );
}
