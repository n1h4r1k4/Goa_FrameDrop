/**
 * Client-side upload of the generated PNGs to Vercel Blob (public), returning a
 * share id for /s/[id]. Bypasses the serverless body limit.
 *
 * A share stores two images under one stem:
 *   frames/<id>.png     the pass itself — what /s/[id] shows, full size
 *   frames/<id>-og.png  the 1200×630 plate — only the og:image tag points here
 *
 * They're separate because they answer different questions: the page should
 * show your card, and X only renders a large card for a ~2:1 image.
 * See the share-og skill.
 */
import { upload } from "@vercel/blob/client";
import { nanoid } from "nanoid";
import { encodeShareId } from "@/lib/share/shareId";

export async function uploadFrame(
  pass: Blob,
  card?: Blob,
): Promise<{ url: string; shareId: string }> {
  const id = nanoid(10);
  const put = (name: string, body: Blob) =>
    upload(name, body, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: "image/png",
    });

  const [passResult] = await Promise.all([
    put(`frames/${id}.png`, pass),
    card ? put(`frames/${id}-og.png`, card) : Promise.resolve(null),
  ]);

  return { url: passResult.url, shareId: encodeShareId(passResult.url) };
}
