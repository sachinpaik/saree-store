"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media-url";
import { cleanupTempUploadsByKeysAction } from "@/app/actions/cleanup-temp";

type UploadedImage = {
  tempId: string;
  storage_key: string;
  file_name: string;
  alt_text?: string;
  is_primary: boolean;
  show_on_homepage: boolean;
};

type PendingUpload = {
  tempId: string;
  file: File;
  objectUrl: string;
  uploading: boolean;
  error?: string;
};

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

  const uploadToStorage = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const storageKey = `temp/${sessionId}/${crypto.randomUUID()}.${ext}`;

    const signRes = await fetch("/api/upload-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storage_key: storageKey, content_type: file.type || undefined }),
    });
    if (!signRes.ok) {
      const err = await signRes.json().catch(() => ({ error: "Sign failed" }));
      throw new Error(err.error || "Upload failed");
    }
    const { put_url, storage_key } = await signRes.json();

    const putRes = await fetch(put_url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type && file.type.length > 0 ? file.type : "application/octet-stream",
      },
    });
    if (!putRes.ok) {
      throw new Error("Upload to storage failed");
    }
    return storage_key;
  }, [sessionId]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setGlobalError(null);
    const fileList = Array.from(files);

    // Create pending uploads with optimistic previews
    const newPending: PendingUpload[] = fileList.map((file) => ({
      tempId: crypto.randomUUID(),
      file,
      objectUrl: URL.createObjectURL(file),
      uploading: true,
    }));

    setPendingUploads((prev) => [...prev, ...newPending]);

    // Upload files one by one
    for (const pending of newPending) {
      try {
        const storage_key = await uploadToStorage(pending.file);

        // Move from pending to uploaded
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
              storage_key,
              file_name: pending.file.name,
              alt_text: "",
              is_primary: isFirst, // First image is auto-primary
              show_on_homepage: false,
            },
          ];
        });
      } catch (err) {
        // Mark as error
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.tempId === pending.tempId
              ? { ...p, uploading: false, error: err instanceof Error ? err.message : "Upload failed" }
              : p
          )
        );
        setGlobalError(err instanceof Error ? err.message : "Upload failed");
      }
    }

    e.target.value = ""; // Reset input
  }

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

  function setShowOnHomepage(tempId: string) {
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        show_on_homepage: img.tempId === tempId,
      }))
    );
  }

  function updateAltText(tempId: string, altText: string) {
    setUploadedImages((prev) =>
      prev.map((img) => (img.tempId === tempId ? { ...img, alt_text: altText } : img))
    );
  }

  const hasImages = uploadedImages.length > 0;
  const isUploading = pendingUploads.some((p) => p.uploading);

  return (
    <div className="space-y-3" data-cleanup={cleanupTempUploads}>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Product Images
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="px-3 py-1.5 border border-stone-300 rounded text-sm font-medium cursor-pointer hover:bg-stone-50">
            {isUploading ? "Uploading…" : "Upload image(s)"}
            <input
              type="file"
              accept="image/*"
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
            Upload product images. First image will be set as primary.
          </p>
        )}
      </div>

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
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="homepage-image"
                  checked={img.show_on_homepage}
                  onChange={() => setShowOnHomepage(img.tempId)}
                  className="border-stone-300"
                />
                Homepage
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
                  Uploading…
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
