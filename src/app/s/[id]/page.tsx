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
          className="w-full max-w-[360px] rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        />
      ) : (
        <p className="font-mono text-sm text-cream/70">
          This frame link has expired or is invalid.
        </p>
      )}

      <h1 className="mt-8 text-center font-display text-4xl font-black uppercase leading-none text-sun-1">
        Frame yours
      </h1>
      <p className="mt-3 text-center font-mono text-xs text-cream/70">
        Make your own HH Goa 2026 frame and post it with{" "}
        <span className="text-sun-1">#{SHARE.hashtag}</span>.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-full bg-sun-1 px-6 py-3 text-center font-mono text-sm font-bold uppercase tracking-widest text-goa-green-deep transition-transform active:scale-95"
        >
          Make your frame
        </Link>
        <a
          href={LINKS.apply}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border-2 border-sun-1 px-6 py-3 text-center font-mono text-sm font-bold uppercase tracking-widest text-sun-1 transition-transform active:scale-95"
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
