import { r2Provider, getR2PublicUrl, getPresignedPutUrl as getPresignedPutUrlFromR2 } from "./r2Provider";
import type { HeadResult, DownloadResult, DownloadRangeOpts } from "./image.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = /^image\//;

/**
 * Upload a product image to storage. Key: {productId}/{uuid}.{ext}
 * Returns the storage key on success.
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<{ storageKey: string } | { error: string }> {
  if (!file?.size) return { error: "No file provided" };
  if (!file.type.match(ALLOWED_IMAGE_TYPES)) return { error: "Only image files are allowed" };
  if (file.size > MAX_FILE_SIZE) return { error: "File size must be less than 10MB" };

  const ext = file.name.split(".").pop() || "jpg";
  const storageKey = `${productId}/${crypto.randomUUID()}.${ext}`;

  try {
    await r2Provider.upload(storageKey, file, { contentType: file.type || undefined });
    return { storageKey };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

/**
 * Delete a product image from storage by its storage key.
 */
export async function deleteProductImage(storageKey: string): Promise<void | { error: string }> {
  try {
    await r2Provider.delete(storageKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Storage deletion failed";
    return { error: `Failed to delete image from storage: ${msg}` };
  }
}

/**
 * Return the best URL for displaying an image: direct R2/public CDN URL when
 * configured, otherwise the app proxy URL (/api/media/...). Set
 * NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL (or CLOUDFLARE_R2_PUBLIC_BASE_URL)
 * to serve images directly from Cloudflare R2/CDN and avoid proxying through Next.js.
 */
export function getProductImageUrl(storageKey: string): string {
  if (!storageKey) return "";
  if (storageKey.startsWith("/api/media/")) return storageKey;
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) return storageKey;
  if (storageKey.includes("..")) return storageKey;
  const directUrl = getPublicUrl(storageKey);
  if (directUrl) return directUrl;
  return `/api/media/${storageKey}`;
}

// --- Low-level passthrough for media route and temp uploads ---

export async function head(key: string): Promise<HeadResult> {
  return r2Provider.head(key);
}

export async function download(key: string): Promise<DownloadResult> {
  return r2Provider.download(key);
}

export async function downloadRange(key: string, range: DownloadRangeOpts): Promise<DownloadResult> {
  if (!r2Provider.downloadRange) throw new Error("Range not supported");
  return r2Provider.downloadRange(key, range);
}

export function getPublicUrl(key: string): string | null {
  return getR2PublicUrl(key);
}

export async function upload(
  key: string,
  body: Blob | Buffer | ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  opts?: { contentType?: string }
): Promise<void> {
  return r2Provider.upload(key, body, opts);
}

export async function deleteByKey(key: string): Promise<void> {
  return r2Provider.delete(key);
}

export async function list(prefix: string): Promise<string[]> {
  if (!r2Provider.list) return [];
  return r2Provider.list(prefix);
}

/**
 * Get a presigned PUT URL for direct browser-to-R2 upload (zero-cost: no file through app server).
 * Returns { putUrl, storageKey }. Client should PUT the file to putUrl with Content-Type header.
 */
export async function getPresignedPutUrl(
  storageKey: string,
  contentType?: string
): Promise<{ putUrl: string; storageKey: string }> {
  return getPresignedPutUrlFromR2(storageKey, contentType);
}
