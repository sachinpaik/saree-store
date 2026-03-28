export const IMAGE_UPLOAD_CONFIG = {
  maxBytes: Number(process.env.NEXT_PUBLIC_PRODUCT_IMAGE_MAX_BYTES ?? 10 * 1024 * 1024),
  minWidth: Number(process.env.NEXT_PUBLIC_PRODUCT_IMAGE_MIN_WIDTH ?? 350),
  allowedMime: ["image/jpeg", "image/png", "image/webp"] as const,
  targetWidths: {
    thumb: 350,
    medium: 1000,
    large: 1800,
  },
} as const;

export type ImageStatus = "uploading" | "processing" | "ready" | "failed";
export type ImageTag = "front" | "border" | "pallu" | "close-up" | "other" | "";

export type UploadedImagePayload = {
  storage_key: string;
  file_name: string;
  alt_text?: string;
  is_primary: boolean;
  image_tag?: ImageTag;
  width?: number;
  height?: number;
  status?: ImageStatus;
  original_url?: string;
  thumb_url?: string;
  medium_url?: string;
  large_url?: string;
  image_url?: string;
};

export function validateImageFile(file: File): string | null {
  if (!IMAGE_UPLOAD_CONFIG.allowedMime.includes(file.type as (typeof IMAGE_UPLOAD_CONFIG.allowedMime)[number])) {
    return "Only JPG, PNG, and WEBP files are allowed.";
  }
  if (file.size > IMAGE_UPLOAD_CONFIG.maxBytes) {
    const maxMb = Math.round((IMAGE_UPLOAD_CONFIG.maxBytes / (1024 * 1024)) * 10) / 10;
    return `Image is too large. Max allowed size is ${maxMb}MB.`;
  }
  return null;
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("Unable to read image dimensions."));
      node.src = objectUrl;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function validateImageDimensions(dim: { width: number; height: number } | null): string | null {
  if (!dim) return null;
  if (dim.width < IMAGE_UPLOAD_CONFIG.minWidth) {
    return `Image is too small. Minimum width is ${IMAGE_UPLOAD_CONFIG.minWidth}px.`;
  }
  return null;
}

/**
 * Migration strategy note:
 * We currently point thumb/medium/large to the same finalized object key.
 * A future async processor can replace these URLs with true resized variants
 * without changing admin/storefront contracts.
 */
export function buildVariantPayloadFromFinalKey(
  finalKey: string,
  meta: {
    alt_text?: string;
    is_primary?: boolean;
    image_tag?: ImageTag;
    width?: number;
    height?: number;
  }
): UploadedImagePayload {
  return {
    storage_key: finalKey,
    file_name: finalKey.split("/").pop() ?? "image",
    alt_text: meta.alt_text ?? "",
    is_primary: Boolean(meta.is_primary),
    image_tag: meta.image_tag ?? "",
    width: meta.width,
    height: meta.height,
    status: "ready",
    original_url: finalKey,
    thumb_url: finalKey,
    medium_url: finalKey,
    large_url: finalKey,
    image_url: finalKey,
  };
}
