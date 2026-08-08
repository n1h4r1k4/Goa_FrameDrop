import type { Metadata, Viewport } from "next";
import { Imbue, Victor_Mono, Mukta } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSiteUrl } from "@/lib/siteUrl";

// Display serif (variable) — oversized headings only
const imbue = Imbue({
  subsets: ["latin"],
  variable: "--font-imbue",
  display: "swap",
});

// Hacker monospace (variable, has italic) — labels, meta, buttons, captions
const victorMono = Victor_Mono({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-victor-mono",
  display: "swap",
});

// Devanagari (static) — the गोवा wordmark
const mukta = Mukta({
  subsets: ["devanagari"],
  weight: ["700", "800"],
  variable: "--font-deva",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HH Goa 2026 · Frame Generator — #FrameInGoa",
  description:
    "Turn any photo into an unmistakable HH Goa 2026 profile frame. Upload, frame, download, and share to X with #FrameInGoa. 5th edition of the series · Goa · 28–31 Oct 2026.",
  applicationName: "HH Goa 2026 Frame Generator",
  keywords: [
    "Hacker House Goa",
    "HH Goa 2026",
    "FrameInGoa",
    "2:47 pm Studio",
    "hackathon",
    "Goa",
  ],
  authors: [{ name: "2:47 pm Studio", url: "https://x.com/247pmstudio" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "HH Goa 2026",
    title: "HH Goa 2026 · Frame Generator",
    description: "Frame your photo for HH Goa 2026 and share with #FrameInGoa.",
    images: [
      {
        url: "/og/default-og.png",
        width: 1200,
        height: 630,
        alt: "HH Goa 2026 — Frame Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@247pmstudio",
    title: "HH Goa 2026 · Frame Generator",
    description: "Frame your photo for HH Goa 2026 and share with #FrameInGoa.",
    images: ["/og/default-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6839",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${imbue.variable} ${victorMono.variable} ${mukta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
