/**
 * YouTube or Vimeo URLs only. Returns the embed URL for an iframe, or
 * null when the link is not a supported video.
 *
 * The embed URL is built from the parsed video ID, never from the raw
 * input, so an arbitrary URL can never become an iframe src.
 */
export function videoEmbedUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "www.youtube-nocookie.com"
  ) {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["embed", "shorts", "v", "live"].includes(parts[0])) {
      return `https://www.youtube-nocookie.com/embed/${parts[1]}`;
    }
    return null;
  }

  if (host === "vimeo.com" || host === "www.vimeo.com" || host === "player.vimeo.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1])) {
      return `https://player.vimeo.com/video/${parts[1]}`;
    }
    if (parts[0] && /^\d+$/.test(parts[0])) {
      return `https://player.vimeo.com/video/${parts[0]}`;
    }
    return null;
  }

  return null;
}
