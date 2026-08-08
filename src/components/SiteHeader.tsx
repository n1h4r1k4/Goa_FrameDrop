import { LINKS } from "@/lib/brand";

export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <a
        href={LINKS.studioX}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-baseline gap-1.5"
        aria-label="2:47 PM Studio on X"
      >
        <span className="font-mono text-lg font-bold leading-none text-sun-1">
          2:47
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-cream/80">
          PM Studio
        </span>
      </a>
      <nav className="flex items-center gap-3 sm:gap-5">
        <a
          href={LINKS.site}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden font-mono text-xs uppercase tracking-widest text-cream/80 transition-colors hover:text-sun-1 sm:inline"
        >
          hhgoa.com ↗
        </a>
        <a
          href={LINKS.apply}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-sun-1 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-goa-green-deep transition-transform active:scale-95"
        >
          Apply
        </a>
      </nav>
    </header>
  );
}
