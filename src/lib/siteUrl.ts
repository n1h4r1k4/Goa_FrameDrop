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
