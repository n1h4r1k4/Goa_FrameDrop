import Image from "next/image";
import { LINKS } from "@/lib/brand";

export default function SiteHeader() {
  return (
    <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <a
        href={LINKS.studioX}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${LINKS.studioName} on X`}
        className="shrink-0"
      >
        <Image
          src="/brand/247-studio.png"
          alt={LINKS.studioName}
          width={148}
          height={90}
          priority
          className="h-9 w-auto"
        />
      </a>

      <nav className="flex shrink-0 items-center gap-2">
        <a
          href={LINKS.site}
          target="_blank"
          rel="noopener noreferrer"
          className="hh-btn hh-btn-paper hidden py-2 text-[0.7rem] sm:inline-flex"
        >
          hhgoa.com
        </a>
        <a
          href={LINKS.apply}
          target="_blank"
          rel="noopener noreferrer"
          className="hh-btn hh-btn-sun py-2 text-[0.7rem]"
        >
          Apply now
        </a>
      </nav>
    </header>
  );
}
