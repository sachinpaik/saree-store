/**
 * Convert storage key to the app's canonical media URL.
 * Implemented here so it can be used in both server and client components
 * without pulling in the images module (zero-cost: client bundle stays small).
 * Direct R2/public URL when NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL is set.
 */
export function getMediaUrl(storageKey: string): string {
  if (!storageKey) return "";
  if (storageKey.startsWith("/api/media/") || storageKey.startsWith("http")) return storageKey;
  if (storageKey.includes("..")) return storageKey;
  const base =
    typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL ||
      process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL);
  if (base) {
    const b = String(base).endsWith("/") ? String(base).slice(0, -1) : String(base);
    return `${b}/${storageKey}`;
  }
  return `/api/media/${storageKey}`;
}
