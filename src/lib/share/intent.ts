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
  params.set("hashtags", `${SHARE.hashtag},${SHARE.crewHashtag}`);
  if (shareUrl) params.set("url", shareUrl);
  // x.com directly — twitter.com/intent only 302s here anyway
  return `https://x.com/intent/tweet?${params.toString()}`;
}

/**
 * Caption for the OS share sheet. The intent URL carries its tags in the
 * `hashtags` parameter, but a native share has no such field — both tags have
 * to live inside the text itself or they never reach the post.
 */
export function nativeCaption(caption: string = SHARE.defaultCaption): string {
  const base = caption.replace(/\s*#FrameInGoa\s*$/i, "").trim();
  return `${base} #${SHARE.hashtag} #${SHARE.crewHashtag}`;
}

/**
 * Open the composer tab *now*, synchronously inside the click, and hand back a
 * handle to point at the intent once the image is hosted. Awaiting first and
 * opening later spends the user activation and the popup gets blocked.
 *
 * Deliberately opened without `noopener`: that flag makes window.open() return
 * null, and we need the handle to navigate it. The destination is x.com.
 */
export function openComposerTab(): Window | null {
  const win = window.open("about:blank", "_blank");
  win?.document?.write(
    `<!doctype html><title>Preparing your post…</title>
     <body style="margin:0;display:grid;place-items:center;height:100vh;
       background:#060d0a;color:#fffbe8;font:600 14px ui-monospace,monospace;
       letter-spacing:.12em;text-transform:uppercase">Preparing your post…</body>`,
  );
  return win;
}
