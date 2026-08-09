import { LINKS, EVENT, SHARE } from "@/lib/brand";

const linkCls =
  "font-mono text-xs text-cream/70 underline-offset-4 transition-colors hover:text-sun-1 hover:underline";

export default function SiteFooter() {
  return (
    <footer className="mt-4">
      <div className="hh-tape" />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-5 py-10 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-cream/60">
          {EVENT.location} · {EVENT.dates}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
          <a
            className={linkCls}
            href={LINKS.site}
            target="_blank"
            rel="noopener noreferrer"
          >
            hhgoa.com
          </a>
          <a
            className={linkCls}
            href={LINKS.studioX}
            target="_blank"
            rel="noopener noreferrer"
          >
            @247pmstudio
          </a>
          <a
            className={linkCls}
            href={LINKS.studioTelegram}
            target="_blank"
            rel="noopener noreferrer"
          >
            telegram
          </a>
          <a className={linkCls} href={LINKS.studioEmail}>
            email
          </a>
        </div>
        <p className="pt-2 font-mono text-xs text-sun-1">
          Tag your pass with{" "}
          <span className="font-bold">#{SHARE.hashtag}</span> &amp;{" "}
          <span className="font-bold">#{SHARE.crewHashtag}</span> on X.
        </p>
        <p className="font-mono text-[0.65rem] text-cream/40">
          © 2026 HH Goa · {LINKS.studioName}
        </p>
      </div>
    </footer>
  );
}
