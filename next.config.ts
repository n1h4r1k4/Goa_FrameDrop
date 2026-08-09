import type { NextConfig } from "next";

/**
 * The production origin, inlined into the client bundle so a share link is
 * built against the stable domain rather than whichever per-deployment
 * *.vercel.app host the browser happens to be on. Empty when nothing is
 * configured (localhost, self-host) — getShareOrigin() then falls back to the
 * current origin.
 */
const productionOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: productionOrigin,
  },
};

export default nextConfig;
