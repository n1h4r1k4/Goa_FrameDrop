import Image from "next/image";
import { LINKS } from "@/lib/brand";

export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <a
        href={LINKS.studioX}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="2:47 PM Studio on X"
      >
        <Image
          src="/brand/247-studio.png"
          alt="2:47 PM Studio"
          width={148}
          height={90}
          priority
          className="h-9 w-auto"
        />
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
