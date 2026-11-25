/* Where the funnel videos, posters and captions are loaded from.

   The page markup still says /v/<file> (the name of each file). Those names are looked up in
   VIDEO_URLS below, which points every video and poster at its public file in the Product Champ
   Media Library (folder "Black Friday 2026 VSL", served from files.leadconnectorhq.com with HTTP
   Range and CORS). Same URLs on every host, so the AI Studio build, the Cloudflare preview and a
   local server all play the same files.

   The media library rejects .vtt files. The caption tracks (burned into the video, kept for assistive
   tech only) and any name not in the map fall back to the Cloudflare Pages Function at /v/<file>,
   which sends CORS headers (pages-preview/functions/v/[file].js). That function also still serves
   the mp4 and jpg files from private R2 as an unused fallback.
   Override the fallback host with VITE_BF_VIDEO_BASE (an absolute URL or a path ending in "/"). */
export const VIDEO_URLS: Record<string, string> = {
  "/v/bf-vsl_web.mp4":
    "https://files.leadconnectorhq.com/file/6b0644cfd50d9db796de4492/bf-vsl-web.mp4",
  "/v/bf-vsl_poster.jpg":
    "https://files.leadconnectorhq.com/file/6b0644a8adc6dbbbbdafa473/bf-vsl-poster.jpg",
  "/v/growth-accel-2027_web.mp4":
    "https://files.leadconnectorhq.com/file/6b0644c2adc6dbbbbdafa876/growth-accel-2027-web.mp4",
  "/v/growth-accel-2027_poster.jpg":
    "https://files.leadconnectorhq.com/file/6b0644a92c68ebcf46f03bdd/growth-accel-2027-poster.jpg",
  "/v/bf-welcome-next-steps_web.mp4":
    "https://files.leadconnectorhq.com/file/6b0644baadc6dbbbbdafa701/bf-welcome-next-steps-web.mp4",
  "/v/bf-welcome-next-steps_poster.jpg":
    "https://files.leadconnectorhq.com/file/6b0644aa306ac23751ea1e57/bf-welcome-next-steps-poster.jpg",
};

export const DEFAULT_VIDEO_BASE = "https://tam-bf-2026-preview.pages.dev/v/";
const VIDEO_HOST = "tam-bf-2026-preview.pages.dev";

function envBase(): string {
  const v = import.meta.env["VITE_BF_VIDEO_BASE"];
  return typeof v === "string" ? v.trim() : "";
}

/** Fallback base (the Cloudflare function), always ending in "/". Relative only on the preview host. */
export function videoBase(): string {
  const fromEnv = envBase();
  const base =
    fromEnv ||
    (typeof location !== "undefined" && location.hostname === VIDEO_HOST
      ? "/v/"
      : DEFAULT_VIDEO_BASE);
  return base.endsWith("/") ? base : base + "/";
}

/** Maps "/v/<file>" to its public URL. Anything not starting with /v/ is returned unchanged. */
export function videoUrl(path: string): string {
  const mapped = VIDEO_URLS[path];
  if (mapped) return mapped;
  return path.startsWith("/v/") ? videoBase() + path.slice(3) : path;
}
