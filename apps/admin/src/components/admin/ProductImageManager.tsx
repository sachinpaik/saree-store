"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  updateProductImageOrder,
  deleteProductImage,
  setPrimaryProductImage,
  updateProductImage,
  replaceProductImageAsset,
} from "@/lib/admin/products";
import { cleanupTempUploadsByKeysAction } from "@/lib/admin/cleanup-temp";
import { getMediaUrl } from "@/lib/media-url";
import { signUploadRequest } from "@/lib/upload-signer";
import { randomUUID } from "@/lib/random-id";
import {
  IMAGE_UPLOAD_CONFIG,
  type ImageTag,
  readImageDimensions,
  validateImageDimensions,
  validateImageFile,
} from "@/lib/admin/image-variants";

type Image = {
  id: string;
  storage_key: string;
  image_url?: string | null;
  original_url?: string | null;
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  sort_order: number;
  alt_text?: string | null;
  image_tag?: string | null;
  status?: "uploading" | "processing" | "ready" | "failed";
  width?: number | null;
  height?: number | null;
  is_primary?: boolean;
};

type PendingPreview = { id: string; file: File; objectUrl: string; progress: number };
type PendingImage = {
  tempId: string;
  storage_key: string;
  file_name: string;
  alt_text?: string;
  is_primary: boolean;
  image_tag?: ImageTag;
  status?: "uploading" | "processing" | "ready" | "failed";
  width?: number;
  height?: number;
  original_url?: string;
  thumb_url?: string;
  medium_url?: string;
  large_url?: string;
  image_url?: string;
  objectUrl: string;
};

function toMediaUrl(value?: string | null): string | null {
  if (!value) return null;
  return value.startsWith("http") ? value : getMediaUrl(value);
}

function getListingPreview(image: {
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  storage_key?: string | null;
  image_url?: string | null;
}): string {
  return (
    toMediaUrl(image.thumb_url) ??
    toMediaUrl(image.medium_url) ??
    toMediaUrl(image.large_url) ??
    toMediaUrl(image.storage_key) ??
    toMediaUrl(image.image_url) ??
    ""
  );
}

export function ProductImageManager({
  productId,
  images: initialImages,
  onPendingImagesChange,
}: {
  productId: string;
  images: Image[];
  onPendingImagesChange?: (
    images: Array<{
      tempId: string;
      storage_key: string;
      file_name: string;
      alt_text?: string;
      image_tag?: string;
      width?: number;
      height?: number;
      status?: "uploading" | "processing" | "ready" | "failed";
      original_url?: string;
      thumb_url?: string;
      medium_url?: string;
      large_url?: string;
      image_url?: string;
      is_primary: boolean;
    }>
  ) => void;
}) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const router = useRouter();
  const showcase = images.find((i) => i.is_primary) ?? images[0];

  const revokePending = useCallback((list: PendingPreview[]) => {
    list.forEach((p) => URL.revokeObjectURL(p.objectUrl));
  }, []);

  useEffect(() => {
    return () => {
      revokePending(pendingPreviews);
      pendingImages.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
  }, [pendingPreviews, pendingImages, revokePending]);

  useEffect(() => {
    onPendingImagesChange?.(
      pendingImages.map((img) => ({
        tempId: img.tempId,
        storage_key: img.storage_key,
        file_name: img.file_name,
        alt_text: img.alt_text ?? "",
        image_tag: img.image_tag ?? "",
        width: img.width,
        height: img.height,
        status: img.status ?? "ready",
        original_url: img.original_url,
        thumb_url: img.thumb_url,
        medium_url: img.medium_url,
        large_url: img.large_url,
        image_url: img.image_url,
        is_primary: false,
      }))
    );
  }, [pendingImages, onPendingImagesChange]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(Array.from(files));
    e.target.value = "";
  }

  async function uploadWithProgress(
    putUrl: string,
    file: File,
    onProgress: (value: number) => void
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", putUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || event.total <= 0) return;
        onProgress(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
          return;
        }
        reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(file);
    });
  }

  const processFiles = useCallback(async (fileList: File[]) => {
    setUploadError(null);
    const previews: PendingPreview[] = fileList.map((file) => ({
      id: randomUUID(),
      file,
      objectUrl: URL.createObjectURL(file),
      progress: 0,
    }));
    setPendingPreviews((prev) => [...prev, ...previews]);
    setUploading(true);
    let lastError: string | null = null;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const fileErr = validateImageFile(file);
        if (fileErr) throw new Error(fileErr);
        const dim = await readImageDimensions(file);
        const dimErr = validateImageDimensions(dim);
        if (dimErr) throw new Error(dimErr);

        const preview = previews.find((p) => p.file === file);
        if (!preview) continue;
        const { putUrl, storageKey } = await signUploadRequest(file, productId, "temp");
        await uploadWithProgress(putUrl, file, (progress) =>
          setPendingPreviews((prev) =>
            prev.map((p) => (p.id === preview.id ? { ...p, progress } : p))
          )
        );
        setPendingImages((prev) => [
          ...prev,
          {
            tempId: preview.id,
            storage_key: storageKey,
            file_name: file.name,
            alt_text: "",
            image_tag: "",
            width: dim?.width,
            height: dim?.height,
            status: "ready",
            original_url: storageKey,
            thumb_url: storageKey,
            medium_url: storageKey,
            large_url: storageKey,
            image_url: storageKey,
            is_primary: false,
            objectUrl: preview.objectUrl,
          },
        ]);
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Upload failed";
        setUploadError(lastError);
      }
      setPendingPreviews((prev) => {
        const next = prev.filter((p) => p.file !== file);
        return next;
      });
    }
    setUploading(false);
  }, [productId]);

  async function removePending(tempId: string) {
    const target = pendingImages.find((img) => img.tempId === tempId);
    if (!target) return;
    setPendingImages((prev) => prev.filter((img) => img.tempId !== tempId));
    URL.revokeObjectURL(target.objectUrl);
    await cleanupTempUploadsByKeysAction([target.storage_key]);
  }

  function updatePendingAltText(tempId: string, altText: string) {
    setPendingImages((prev) =>
      prev.map((img) => (img.tempId === tempId ? { ...img, alt_text: altText } : img))
    );
  }

  function updatePendingTag(tempId: string, imageTag: ImageTag) {
    setPendingImages((prev) =>
      prev.map((img) => (img.tempId === tempId ? { ...img, image_tag: imageTag } : img))
    );
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= images.length) return;
    const newOrder = [...images];
    [newOrder[index], newOrder[next]] = [newOrder[next], newOrder[index]];
    setImages(newOrder);
    await updateProductImageOrder(
      productId,
      newOrder.map((i) => i.id)
    );
    router.refresh();
  }

  async function remove(imageId: string) {
    const result = await deleteProductImage(imageId, productId);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== imageId));
    router.refresh();
  }

  async function setPrimary(imageId: string) {
    await setPrimaryProductImage(imageId, productId);
    setImages((prev) =>
      prev.map((i) => ({ ...i, is_primary: i.id === imageId }))
    );
    router.refresh();
  }

  async function saveAltText(imageId: string, altText: string) {
    await updateProductImage(imageId, productId, { alt_text: altText || null });
    setImages((prev) =>
      prev.map((i) => (i.id === imageId ? { ...i, alt_text: altText || null } : i))
    );
    router.refresh();
  }

  async function saveTag(imageId: string, imageTag: string) {
    await updateProductImage(imageId, productId, { image_tag: imageTag || null });
    setImages((prev) =>
      prev.map((i) => (i.id === imageId ? { ...i, image_tag: imageTag || null } : i))
    );
    router.refresh();
  }

  async function replaceImage(imageId: string, file: File) {
    const fileErr = validateImageFile(file);
    if (fileErr) {
      setUploadError(fileErr);
      return;
    }
    const dim = await readImageDimensions(file);
    const dimErr = validateImageDimensions(dim);
    if (dimErr) {
      setUploadError(dimErr);
      return;
    }
    try {
      setUploadError(null);
      const { putUrl, storageKey } = await signUploadRequest(file, productId, "temp");
      await uploadWithProgress(putUrl, file, () => {});
      const result = await replaceProductImageAsset(imageId, productId, {
        storage_key: storageKey,
        file_name: file.name,
        is_primary: false,
        width: dim?.width,
        height: dim?.height,
        status: "ready",
        original_url: storageKey,
        thumb_url: storageKey,
        medium_url: storageKey,
        large_url: storageKey,
        image_url: storageKey,
      });
      if (result.error) {
        setUploadError(result.error);
        await cleanupTempUploadsByKeysAction([storageKey]);
        return;
      }
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Replace failed");
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="border border-dashed border-stone-300 rounded p-4 bg-stone-50/50"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = Array.from(e.dataTransfer.files || []);
          void processFiles(dropped);
        }}
      >
      <div className="flex items-center gap-2 flex-wrap">
        <label className="px-3 py-1.5 border border-stone-300 rounded text-sm font-medium cursor-pointer hover:bg-stone-50">
          {uploading ? "Uploading…" : "Upload image(s)"}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
      </div>
      <p className="text-xs text-stone-500 mt-2">
        Drag/drop or upload. Allowed: JPG/PNG/WEBP. Max size {Math.round(IMAGE_UPLOAD_CONFIG.maxBytes / (1024 * 1024))}MB. Minimum width {IMAGE_UPLOAD_CONFIG.minWidth}px.
      </p>
      </div>
      {showcase && (
        <div className="border border-stone-200 rounded bg-white p-3">
          <p className="text-xs font-semibold tracking-wide text-stone-600 uppercase mb-2">Storefront preview</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-stone-500 mb-1">Listing (thumb)</p>
              <div className="relative aspect-square rounded overflow-hidden border border-stone-200 bg-stone-50">
                <Image src={getListingPreview({ ...showcase, thumb_url: showcase.thumb_url ?? showcase.storage_key })} alt="" fill className="object-cover" unoptimized />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-stone-500 mb-1">PDP (medium)</p>
              <div className="relative aspect-square rounded overflow-hidden border border-stone-200 bg-stone-50">
                <Image src={getListingPreview({ ...showcase, thumb_url: showcase.medium_url ?? showcase.storage_key })} alt="" fill className="object-cover" unoptimized />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-stone-500 mb-1">Zoom (large)</p>
              <div className="relative aspect-square rounded overflow-hidden border border-stone-200 bg-stone-50">
                <Image src={getListingPreview({ ...showcase, thumb_url: showcase.large_url ?? showcase.storage_key })} alt="" fill className="object-cover" unoptimized />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="relative border border-stone-200 rounded overflow-hidden bg-stone-50 w-[140px]"
          >
            <div className="relative group aspect-square">
              <Image
                src={getListingPreview(img)}
                alt={img.alt_text ?? ""}
                fill
                className="object-cover"
                sizes="140px"
                unoptimized
              />
              {img.is_primary && (
                <span className="absolute top-1 left-1 text-[10px] bg-stone-800 text-white px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 bg-white rounded text-stone-700 disabled:opacity-50"
                  title="Move left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="p-1.5 bg-white rounded text-stone-700 disabled:opacity-50"
                  title="Move right"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(img.id)}
                  className="p-1.5 bg-white rounded text-stone-700"
                  title="Set as primary"
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="p-1.5 bg-red-600 text-white rounded"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-1.5 space-y-1">
              <input
                type="text"
                defaultValue={img.alt_text ?? ""}
                placeholder="Alt text"
                className="w-full text-xs px-2 py-1 border border-stone-200 rounded"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (img.alt_text ?? "")) saveAltText(img.id, v);
                }}
              />
              <select
                defaultValue={img.image_tag ?? ""}
                className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white"
                onChange={(e) => saveTag(img.id, e.target.value)}
              >
                <option value="">Tag (optional)</option>
                <option value="front">front</option>
                <option value="border">border</option>
                <option value="pallu">pallu</option>
                <option value="close-up">close-up</option>
                <option value="other">other</option>
              </select>
              <div className="text-[10px] text-stone-500">
                <div>{img.width && img.height ? `${img.width}×${img.height}` : "Dimensions unknown"}</div>
                <div>Status: {img.status ?? "ready"}</div>
              </div>
              <label className="inline-flex items-center justify-center w-full text-xs px-2 py-1 border border-stone-200 rounded cursor-pointer hover:bg-stone-100">
                Replace
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void replaceImage(img.id, file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))}
        {pendingImages.map((img) => (
          <div
            key={img.tempId}
            className="relative border border-amber-300 rounded overflow-hidden bg-amber-50/40 w-[140px]"
          >
            <div className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.objectUrl}
                alt={img.alt_text ?? img.file_name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1 left-1 text-[10px] bg-amber-700 text-white px-1.5 py-0.5 rounded">
                Pending save
              </span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removePending(img.tempId)}
                  className="p-1.5 bg-red-600 text-white rounded"
                  title="Remove pending image"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-1.5 space-y-1">
              <input
                type="text"
                defaultValue={img.alt_text ?? ""}
                placeholder="Alt text"
                className="w-full text-xs px-2 py-1 border border-stone-200 rounded"
                onBlur={(e) => updatePendingAltText(img.tempId, e.target.value.trim())}
              />
              <select
                defaultValue={img.image_tag ?? ""}
                className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white"
                onChange={(e) => updatePendingTag(img.tempId, e.target.value as ImageTag)}
              >
                <option value="">Tag (optional)</option>
                <option value="front">front</option>
                <option value="border">border</option>
                <option value="pallu">pallu</option>
                <option value="close-up">close-up</option>
                <option value="other">other</option>
              </select>
              <p className="text-[10px] text-stone-500">
                {img.width && img.height ? `${img.width}×${img.height}` : "Dimensions unknown"} · {img.status ?? "ready"}
              </p>
            </div>
          </div>
        ))}
        {pendingPreviews.map((p) => (
          <div
            key={p.id}
            className="relative border border-stone-200 rounded overflow-hidden bg-stone-50 w-[140px] border-dashed"
          >
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.objectUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs">
                Uploading… {p.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
