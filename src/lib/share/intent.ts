/** Build an X (Twitter) web-intent URL with a pre-filled caption + #FrameInGoa. */
import { SHARE } from "@/lib/brand";

export function tweetUrl(
  shareUrl?: string,
  caption: string = SHARE.defaultCaption,
): string {
  // avoid a duplicate hashtag: strip a trailing #FrameInGoa and use the hashtags param
  const text = caption.replace(/\s*#FrameInGoa\s*$/i, "").trim();
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("hashtags", SHARE.hashtag);
  if (shareUrl) params.set("url", shareUrl);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
