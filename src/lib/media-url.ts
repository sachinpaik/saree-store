/**
 * Image URL helpers for zero-cost architecture.
 *
 * Public storefront: getPublicImageUrl (direct R2/CDN only).
 * Admin: getMediaUrl (same – direct R2/CDN only; no image proxy API).
 */

const getPublicBaseUrl = (): string | null => {
  if (typeof process === "undefined") return null;
  const base =
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  return base ? String(base).trim() || null : null;
};

/**
 * Public storefront image URL only. Returns direct R2/CDN URL.
 * No image proxy – public traffic must not depend on app server.
 * Returns "" when R2 public base URL is not configured (require it for storefront).
 */
export function getPublicImageUrl(storageKey: string): string {
  if (!storageKey || storageKey.includes("..")) return "";
  if (storageKey.startsWith("http")) return storageKey;
  const base = getPublicBaseUrl();
  if (!base) return "";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}/${storageKey}`;
}

/**
 * Media URL: direct R2/CDN only (same as getPublicImageUrl; no image proxy).
 * Use getPublicImageUrl for storefront; getMediaUrl for admin. Both require R2 public base URL.
 * Returns "" when no public base URL. Pass-through for keys that are already full URLs.
 */
export function getMediaUrl(storageKey: string): string {
  if (!storageKey || storageKey.includes("..")) return "";
  if (storageKey.startsWith("http")) return storageKey;
  const base = getPublicBaseUrl();
  if (!base) return "";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}/${storageKey}`;
}

export function resolveImageVariantUrl(
  image: {
    thumb_url?: string | null;
    medium_url?: string | null;
    large_url?: string | null;
    storage_key?: string | null;
    image_url?: string | null;
  },
  variant: "thumb" | "medium" | "large"
): string {
  const order =
    variant === "thumb"
      ? [image.thumb_url, image.medium_url, image.large_url]
      : variant === "medium"
        ? [image.medium_url, image.large_url, image.thumb_url]
        : [image.large_url, image.medium_url, image.thumb_url];
  for (const candidate of [...order, image.storage_key, image.image_url]) {
    if (!candidate) continue;
    const resolved = getPublicImageUrl(candidate);
    if (resolved) return resolved;
  }
  return "";
}
