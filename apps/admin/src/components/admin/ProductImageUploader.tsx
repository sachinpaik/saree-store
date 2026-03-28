"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media-url";
import { cleanupTempUploadsByKeysAction } from "@/lib/admin/cleanup-temp";
import { signUploadRequest } from "@/lib/upload-signer";
import { randomUUID } from "@/lib/random-id";
import {
  IMAGE_UPLOAD_CONFIG,
  type ImageTag,
  type UploadedImagePayload,
  readImageDimensions,
  validateImageDimensions,
  validateImageFile,
} from "@/lib/admin/image-variants";

type UploadedImage = UploadedImagePayload & {
  tempId: string;
};

type PendingUpload = {
  tempId: string;
  file: File;
  objectUrl: string;
  progress: number;
  uploading: boolean;
  error?: string;
  width?: number;
  height?: number;
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

type ProductImageUploaderProps = {
  onImagesChange: (images: UploadedImage[]) => void;
  initialImages?: UploadedImage[];
  sessionId: string;
  onCleanup?: () => Promise<void>;
};

/**
 * Image uploader for new product creation (before product ID exists).
 * 
 * Uploads images immediately to storage and keeps metadata in local state.
 * When product is created, parent passes storage keys to link images to product.
 * 
 * Session tracking:
 * - Each uploader instance has a sessionId (passed from parent)
 * - Temp files uploaded to: temp/<sessionId>/<uuid>.<ext>
 * - On unmount or cleanup, temp files are deleted
 */
export function ProductImageUploader({
  onImagesChange,
  initialImages = [],
  sessionId,
  onCleanup,
}: ProductImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const cleanupCalledRef = useRef(false);

  // Notify parent of changes
  useEffect(() => {
    onImagesChange(uploadedImages);
  }, [uploadedImages, onImagesChange]);

  // Cleanup temp files on unmount
  useEffect(() => {
    return () => {
      // Cleanup object URLs
      pendingUploads.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
  }, [pendingUploads]);

  // Cleanup function to delete all temp uploads
  const cleanupTempUploads = useCallback(async () => {
    if (cleanupCalledRef.current) return;
    cleanupCalledRef.current = true;

    const storageKeys = uploadedImages.map((img) => img.storage_key);
    
    if (storageKeys.length === 0) return;

    try {
      const { error } = await cleanupTempUploadsByKeysAction(storageKeys);
      if (error) {
        console.warn("Failed to cleanup temp uploads:", error);
      }
    } catch (err) {
      console.warn("Error cleaning up temp uploads:", err);
    }

    // Call parent cleanup handler if provided
    if (onCleanup) {
      await onCleanup();
    }
  }, [uploadedImages, onCleanup]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
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
    setGlobalError(null);
    const accepted: PendingUpload[] = [];
    const errors: string[] = [];

    for (const file of fileList) {
      const fileErr = validateImageFile(file);
      if (fileErr) {
        errors.push(`${file.name}: ${fileErr}`);
        continue;
      }
      const dim = await readImageDimensions(file);
      const dimErr = validateImageDimensions(dim);
      if (dimErr) {
        errors.push(`${file.name}: ${dimErr}`);
        continue;
      }
      accepted.push({
        tempId: randomUUID(),
        file,
        objectUrl: URL.createObjectURL(file),
        progress: 0,
        uploading: true,
        width: dim?.width,
        height: dim?.height,
      });
    }

    if (errors.length) {
      setGlobalError(errors.join(" "));
    }
    if (!accepted.length) return;

    setPendingUploads((prev) => [...prev, ...accepted]);

    for (const pending of accepted) {
      try {
        const { putUrl, storageKey } = await signUploadRequest(pending.file, sessionId, "temp");
        await uploadWithProgress(putUrl, pending.file, (progress) =>
          setPendingUploads((prev) =>
            prev.map((p) => (p.tempId === pending.tempId ? { ...p, progress } : p))
          )
        );

        setPendingUploads((prev) => {
          const item = prev.find((p) => p.tempId === pending.tempId);
          if (item) URL.revokeObjectURL(item.objectUrl);
          return prev.filter((p) => p.tempId !== pending.tempId);
        });

        setUploadedImages((prev) => {
          const isFirst = prev.length === 0;
          return [
            ...prev,
            {
              tempId: pending.tempId,
              storage_key: storageKey,
              file_name: pending.file.name,
              alt_text: "",
              image_tag: "",
              width: pending.width,
              height: pending.height,
              status: "ready",
              original_url: storageKey,
              thumb_url: storageKey,
              medium_url: storageKey,
              large_url: storageKey,
              image_url: storageKey,
              is_primary: isFirst,
            },
          ];
        });
      } catch (err) {
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.tempId === pending.tempId
              ? {
                  ...p,
                  uploading: false,
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : p
          )
        );
        setGlobalError(err instanceof Error ? err.message : "Upload failed");
      }
    }
  }, [sessionId]);

  function removeImage(tempId: string) {
    setUploadedImages((prev) => {
      const updated = prev.filter((img) => img.tempId !== tempId);
      // If we removed the primary, make the first one primary
      if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  }

  function removePending(tempId: string) {
    setPendingUploads((prev) => {
      const item = prev.find((p) => p.tempId === tempId);
      if (item) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((p) => p.tempId !== tempId);
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= uploadedImages.length) return;

    setUploadedImages((prev) => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[next]] = [newOrder[next], newOrder[index]];
      return newOrder;
    });
  }

  function setPrimary(tempId: string) {
    setUploadedImages((prev) =>
      prev.map((img) => ({ ...img, is_primary: img.tempId === tempId }))
    );
  }

  function updateAltText(tempId: string, altText: string) {
    setUploadedImages((prev) =>
      prev.map((img) => (img.tempId === tempId ? { ...img, alt_text: altText } : img))
    );
  }

  function updateTag(tempId: string, imageTag: ImageTag) {
    setUploadedImages((prev) =>
      prev.map((img) => (img.tempId === tempId ? { ...img, image_tag: imageTag } : img))
    );
  }

  async function replaceUploaded(tempId: string, file: File) {
    const fileErr = validateImageFile(file);
    if (fileErr) {
      setGlobalError(fileErr);
      return;
    }
    const dim = await readImageDimensions(file);
    const dimErr = validateImageDimensions(dim);
    if (dimErr) {
      setGlobalError(dimErr);
      return;
    }
    const existing = uploadedImages.find((img) => img.tempId === tempId);
    if (!existing) return;
    try {
      const { putUrl, storageKey } = await signUploadRequest(file, sessionId, "temp");
      await uploadWithProgress(putUrl, file, () => {});
      await cleanupTempUploadsByKeysAction([existing.storage_key]);
      setUploadedImages((prev) =>
        prev.map((img) =>
          img.tempId === tempId
            ? {
                ...img,
                storage_key: storageKey,
                file_name: file.name,
                width: dim?.width,
                height: dim?.height,
                status: "ready",
                original_url: storageKey,
                thumb_url: storageKey,
                medium_url: storageKey,
                large_url: storageKey,
                image_url: storageKey,
              }
            : img
        )
      );
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Replace failed");
    }
  }

  const hasImages = uploadedImages.length > 0;
  const isUploading = pendingUploads.some((p) => p.uploading);
  const showcase = uploadedImages.find((i) => i.is_primary) ?? uploadedImages[0];

  return (
    <div className="space-y-3" data-cleanup={cleanupTempUploads}>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Product Images
        </label>
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
            {isUploading ? "Uploading…" : "Upload image(s)"}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={isUploading}
              onChange={handleFileSelect}
            />
          </label>
          {globalError && <span className="text-sm text-red-600">{globalError}</span>}
        </div>
        {!hasImages && !pendingUploads.length && (
          <p className="text-sm text-stone-500 mt-2">
            Drag/drop or upload. Allowed: JPG/PNG/WEBP. Max size {Math.round(IMAGE_UPLOAD_CONFIG.maxBytes / (1024 * 1024))}MB. Minimum width {IMAGE_UPLOAD_CONFIG.minWidth}px.
          </p>
        )}
        </div>
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
        {/* Uploaded images */}
        {uploadedImages.map((img, index) => (
          <div
            key={img.tempId}
            className="relative border border-stone-200 rounded overflow-hidden bg-stone-50 w-[140px]"
          >
            <div className="relative group aspect-square">
              <Image
                src={getMediaUrl(img.storage_key)}
                alt={img.alt_text ?? img.file_name}
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
                  disabled={index === uploadedImages.length - 1}
                  className="p-1.5 bg-white rounded text-stone-700 disabled:opacity-50"
                  title="Move right"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(img.tempId)}
                  className="p-1.5 bg-white rounded text-stone-700"
                  title="Set as primary"
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.tempId)}
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
                onBlur={(e) => updateAltText(img.tempId, e.target.value.trim())}
              />
              <select
                defaultValue={img.image_tag ?? ""}
                className="w-full text-xs px-2 py-1 border border-stone-200 rounded bg-white"
                onChange={(e) => updateTag(img.tempId, e.target.value as ImageTag)}
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
              <label className="inline-flex items-center justify-center w-full text-xs px-2 py-1 border border-stone-200 rounded cursor-pointer hover:bg-stone-100">
                Replace
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void replaceUploaded(img.tempId, file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))}

        {/* Pending uploads */}
        {pendingUploads.map((p) => (
          <div
            key={p.tempId}
            className="relative border border-stone-200 rounded overflow-hidden bg-stone-50 w-[140px] border-dashed"
          >
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.objectUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              {p.uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs">
                  Uploading… {p.progress}%
                </span>
              )}
              {p.error && (
                <>
                  <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-xs p-1 text-center">
                    <span className="font-semibold">Error</span>
                    <span className="text-[10px]">{p.error}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(p.tempId)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded text-xs"
                    title="Remove"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
