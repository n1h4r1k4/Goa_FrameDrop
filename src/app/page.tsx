import Generator from "@/components/Generator";
import { EVENT, WORDMARK } from "@/lib/brand";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center px-5 py-10 sm:py-14">
      <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-cream/70">
        {EVENT.location} · {EVENT.dates}
      </p>

      <h1
        className="text-center font-display font-black uppercase leading-[0.78] text-sun-1"
        style={{ fontSize: "clamp(2.75rem, 12vw, 7rem)" }}
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

      <p className="mt-5 font-mono text-sm text-cream/80">{EVENT.tagline}</p>
      <p className="mt-2 max-w-sm text-center font-mono text-xs text-cream/55">
        Frame your photo for the 5th edition on the sand — then share it with{" "}
        <span className="text-sun-1">#{"FrameInGoa"}</span>.
      </p>

      <Generator />
    </main>
  );
}
