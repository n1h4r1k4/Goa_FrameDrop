/**
 * Share id — no datastore. /s/[id] turns it back into the public Blob PNG URL
 * and points the OG image at it.
 *
 * The id used to be base64 of the whole blob URL, which ran ~148 characters and
 * made an ugly link in the post. Everything except two ids is constant, so the
 * id is now just "<storeId>.<fileId>" (~57 chars) and the URL is rebuilt from a
 * fixed template — which also means it can only ever point at our Blob store,
 * no host validation needed. Old base64 ids still resolve so links already
 * posted keep working.
 */

const HOST_SUFFIX = ".public.blob.vercel-storage.com";
const DIR = "frames";

const COMPACT = /^([a-z0-9]{6,48})\.([A-Za-z0-9_-]{6,120})$/;

function toBase64(s: string): string {
  return typeof btoa !== "undefined"
    ? btoa(s)
    : Buffer.from(s, "utf8").toString("base64");
}
function fromBase64(s: string): string {
  return typeof atob !== "undefined"
    ? atob(s)
    : Buffer.from(s, "base64").toString("utf8");
}

export function encodeShareId(url: string): string {
  try {
    const u = new URL(url);
    const store = u.hostname.slice(0, -HOST_SUFFIX.length);
    const file = u.pathname
      .replace(/^\/+/, "")
      .replace(new RegExp(`^${DIR}/`), "")
      .replace(/\.png$/i, "");
    if (u.hostname.endsWith(HOST_SUFFIX) && COMPACT.test(`${store}.${file}`)) {
      return `${store}.${file}`;
    }
  } catch {
    /* fall through to the long form */
  }
  // anything unexpected: keep the lossless encoding rather than a broken link
  return toBase64(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The two images behind a share: `pass` is the card itself (what the page
 * shows), `og` is the 1200×630 plate the link preview points at. Older shares
 * only stored one image, so both fall back to it.
 */
export type ShareImages = { pass: string; og: string; back: string | null };

export function shareImages(id: string): ShareImages | null {
  const compact = COMPACT.exec(id);
  if (compact) {
    const base = `https://${compact[1]}${HOST_SUFFIX}/${DIR}/${compact[2]}`;
    // Our own stems are nanoid(10). Anything longer is a pre-plate share whose
    // pathname carried Blob's random suffix — it has no -og/-back twin.
    const twins = compact[2].length <= 12;
    return {
      pass: `${base}.png`,
      og: `${base}${twins ? "-og" : ""}.png`,
      // shares made before the flip existed 404 here; the page probes it and
      // simply hides the button
      back: twins ? `${base}-back.png` : null,
    };
  }
  // legacy base64 ids — validate the host, since the URL came from the id
  try {
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    const u = new URL(fromBase64(b64));
    if (u.protocol !== "https:") return null;
    if (!u.hostname.endsWith(".blob.vercel-storage.com")) return null;
    return { pass: u.toString(), og: u.toString(), back: null };
  } catch {
    return null;
  }
}

/** The card image alone. */
export function decodeShareId(id: string): string | null {
  return shareImages(id)?.pass ?? null;
}
