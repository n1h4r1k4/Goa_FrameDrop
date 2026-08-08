/**
 * Share id = base64url of the public Blob PNG URL — no datastore needed.
 * /s/[id] decodes it back to set the OG image. Decode validates the host so the
 * OG tag can only ever point at our Blob store (no arbitrary-URL abuse).
 * See the share-og skill.
 */

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
  return toBase64(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Returns the validated public Blob URL, or null if the id is malformed/untrusted. */
export function decodeShareId(id: string): string | null {
  try {
    const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
    const url = fromBase64(b64);
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (!u.hostname.endsWith(".blob.vercel-storage.com")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
