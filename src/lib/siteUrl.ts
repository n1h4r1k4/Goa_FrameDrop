/**
 * Canonical site URL for metadata/OG. Prefers an explicit NEXT_PUBLIC_SITE_URL,
 * then Vercel's production/deploy URL, then localhost — so OG works on Vercel with
 * zero config.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Origin to build a posted share link from, in the browser.
 *
 * Deliberately not `window.location.origin`. A deployment host like
 * `id-4j6i2os8c-p4-l.vercel.app` belongs to one build: share from it and the
 * link stops resolving once that deployment is superseded, and it disagrees
 * with the `og:url` the page itself advertises. The production origin is
 * inlined at build time (see next.config.ts); the current origin is only the
 * fallback, for localhost and for a self-host with nothing configured.
 */
export function getShareOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}
