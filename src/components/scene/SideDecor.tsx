/**
 * Decorative brand line-art that fills the empty desktop side margins.
 * Palms + sparkles + a sun/moon, drawn in faint cream/sun tones. Non-interactive,
 * behind the content, and hidden on small screens where there is no side space.
 */

function Palm({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 440"
      fill="none"
      className="h-full w-auto"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M104 440 C98 350 92 270 100 196" />
        <path d="M100 196 C64 176 34 176 8 192" />
        <path d="M100 196 C70 166 48 140 34 108" />
        <path d="M100 196 C98 154 104 116 112 78" />
        <path d="M100 196 C134 172 162 150 186 120" />
        <path d="M100 196 C136 182 170 182 196 198" />
      </g>
      <g fill="currentColor">
        <circle cx="96" cy="201" r="6" />
        <circle cx="111" cy="205" r="5" />
        <circle cx="88" cy="211" r="4.5" />
      </g>
    </svg>
  );
}

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
    </svg>
  );
}

export default function SideDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden lg:block"
    >
      {/* palms anchored to the bottom of each margin */}
      <div className="absolute bottom-0 left-[2%] h-[60vh] text-cream/10">
        <Palm />
      </div>
      <div className="absolute bottom-0 right-[2%] h-[70vh] text-cream/10">
        <Palm flip />
      </div>

      {/* faint sun (left) */}
      <svg
        viewBox="0 0 120 120"
        className="absolute left-[5%] top-[16%] h-24 w-24 text-sun-1/15"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="60" cy="60" r="26" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          // round so server + client stringify identically (no hydration mismatch)
          const r = (n: number) => Math.round(n * 100) / 100;
          return (
            <line
              key={i}
              x1={r(60 + Math.cos(a) * 34)}
              y1={r(60 + Math.sin(a) * 34)}
              x2={r(60 + Math.cos(a) * 46)}
              y2={r(60 + Math.sin(a) * 46)}
            />
          );
        })}
      </svg>

      {/* crescent moon (right) */}
      <svg
        viewBox="0 0 100 100"
        className="absolute right-[6%] top-[13%] h-16 w-16 text-cream/12"
        fill="currentColor"
        aria-hidden
      >
        <path d="M70 50 A28 28 0 1 1 42 22 A22 22 0 1 0 70 50 Z" />
      </svg>

      {/* scattered sparkles */}
      <Spark className="absolute left-[9%] top-[40%] h-5 w-5 text-sun-1/25" />
      <Spark className="absolute left-[4%] top-[60%] h-3 w-3 text-cream/20" />
      <Spark className="absolute right-[10%] top-[34%] h-6 w-6 text-sun-1/20" />
      <Spark className="absolute right-[5%] top-[52%] h-3.5 w-3.5 text-cream/20" />
      <Spark className="absolute right-[12%] top-[66%] h-4 w-4 text-sun-1/15" />
    </div>
  );
}
