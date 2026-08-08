import type { Metadata } from "next";
import Link from "next/link";
import { decodeShareId } from "@/lib/share/shareId";
import { EXPORT_SIZE } from "@/lib/canvas/constants";
import { SHARE, LINKS, EVENT } from "@/lib/brand";

type Params = { id: string };

const TITLE = "I'm in for HH Goa 2026 · #FrameInGoa";
const DESCRIPTION =
  "Frame your photo for Hacker House Goa 2026 (5th edition · Goa · 28–31 Oct) and share it with #FrameInGoa.";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const imageUrl = decodeShareId(id);
  if (!imageUrl) return { title: TITLE, description: DESCRIPTION };
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: `/s/${id}`,
      type: "website",
      images: [
        { url: imageUrl, width: EXPORT_SIZE, height: EXPORT_SIZE, type: "image/png" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SHARE.handle,
      title: TITLE,
      description: DESCRIPTION,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const imageUrl = decodeShareId(id);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-cream/70">
        {EVENT.location} · {EVENT.dates}
      </p>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt="HH Goa 2026 frame"
          width={360}
          height={360}
          className="w-full max-w-[360px] rounded-xl border-[3px] border-ink shadow-[7px_7px_0_var(--color-ink)]"
        />
      ) : (
        <p className="hh-panel px-5 py-4 font-mono text-sm">
          This frame link has expired or is invalid.
        </p>
      )}

      <h1 className="hh-h mt-10 text-center text-5xl text-sun-1">Frame yours</h1>
      <p className="mt-3 text-center font-mono text-xs text-cream/70">
        Make your own HH Goa 2026 pass and post it with{" "}
        <span className="font-bold text-sun-1">#{SHARE.hashtag}</span>.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="hh-btn hh-btn-sun">
          Make your pass
        </Link>
        <a
          href={LINKS.apply}
          target="_blank"
          rel="noopener noreferrer"
          className="hh-btn hh-btn-pink"
        >
          Apply to HH Goa
        </a>
      </div>

      <a
        href={LINKS.site}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 font-mono text-xs text-cream/50 hover:text-sun-1"
      >
        hhgoa.com ↗
      </a>
    </main>
  );
}
