/**
 * Client-side upload of the generated PNG to Vercel Blob (public), returning a
 * share id for /s/[id]. Bypasses the serverless body limit. See the share-og skill.
 */
import { upload } from "@vercel/blob/client";
import { nanoid } from "nanoid";
import { encodeShareId } from "@/lib/share/shareId";

export async function uploadFrame(
  blob: Blob,
): Promise<{ url: string; shareId: string }> {
  const id = nanoid(10);
  const result = await upload(`frames/${id}.png`, blob, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: "image/png",
  });
  return { url: result.url, shareId: encodeShareId(result.url) };
}
