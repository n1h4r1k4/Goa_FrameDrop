/**
 * Vercel Blob client-upload token endpoint. No login, so the abuse guards live
 * here: PNG-only + a size cap + random suffix. See the share-og skill.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/png"],
        // A retina ticket is 2000×3000 and a crew card 2400²; both clear 6 MB,
        // and hitting the cap silently dropped the share to a text-only post.
        maximumSizeInBytes: 20_000_000,
        addRandomSuffix: true,
      }),
      // Not reachable on localhost; the browser gets the URL from upload() directly.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
