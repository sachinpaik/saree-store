import { getPublicImageUrl } from "./media-url";

export type ProductImageLike = {
  storage_key?: string | null;
  image_url?: string | null;
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  alt_text?: string | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
  status?: "uploading" | "processing" | "ready" | "failed" | string | null;
};

export type ProductLike = {
  title?: string | null;
  images?: ProductImageLike[] | null;
};

function toPublicUrl(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  const resolved = getPublicImageUrl(v);
  return resolved || null;
}

export function isStorefrontUsableImage(image: ProductImageLike): boolean {
  // Legacy rows may have no status. Treat missing status as usable.
  if (image.status == null || image.status === "") return true;
  return image.status === "ready";
}

export function sortProductImages(images: ProductImageLike[]): ProductImageLike[] {
  return images
    .slice()
    .sort((a, b) => {
      const ap = a.is_primary ? 1 : 0;
      const bp = b.is_primary ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const as = a.sort_order ?? Number.MAX_SAFE_INTEGER;
      const bs = b.sort_order ?? Number.MAX_SAFE_INTEGER;
      return as - bs;
    });
}

export function getVisibleProductImages(images: ProductImageLike[] | null | undefined): ProductImageLike[] {
  const list = (images ?? []).filter(isStorefrontUsableImage);
  return sortProductImages(list);
}

export function getPrimaryProductImage(
  product: ProductLike | null | undefined
): ProductImageLike | null {
  const list = getVisibleProductImages(product?.images ?? []);
  return list[0] ?? null;
}

function firstUrl(candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const url = toPublicUrl(candidate);
    if (url) return url;
  }
  return "";
}

export function getCardImageUrl(image: ProductImageLike | null | undefined): string {
  if (!image) return "";
  return firstUrl([image.thumb_url, image.medium_url, image.image_url, image.storage_key]);
}

export function getProductMainImageUrl(image: ProductImageLike | null | undefined): string {
  if (!image) return "";
  return firstUrl([image.medium_url, image.large_url, image.image_url, image.storage_key]);
}

export function getThumbnailImageUrl(image: ProductImageLike | null | undefined): string {
  if (!image) return "";
  return firstUrl([image.thumb_url, image.medium_url, image.image_url, image.storage_key]);
}

export function getZoomImageUrl(image: ProductImageLike | null | undefined): string {
  if (!image) return "";
  return firstUrl([image.large_url, image.medium_url, image.image_url, image.storage_key]);
}

export function getProductImageAlt(
  image: ProductImageLike | null | undefined,
  productTitle?: string | null
): string {
  return image?.alt_text?.trim() || productTitle?.trim() || "Product image";
}
