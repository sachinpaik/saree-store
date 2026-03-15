"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  registerDraftImage,
  removeImageFromDraft,
  updateDraftImage,
  reorderDraftImages,
} from "@/app/actions/draft-images";
import { getMediaUrl } from "@/lib/media-url";

type DraftImage = {
  id?: string;
  storage_key: string;
  alt_text?: string | null;
  is_primary?: boolean;
  show_on_homepage?: boolean;
  sort_order: number;
  is_draft_only?: boolean;
  marked_for_deletion?: boolean;
};

type PendingPreview = { id: string; file: File; objectUrl: string };

export function DraftImageManager({
  productId,
  images: initialImages,
  onImagesChange,
}: {
  productId: string;
  images: DraftImage[];
  onImagesChange?: () => void;
}) {
  const [images, setImages] = useState<DraftImage[]>(
    initialImages.filter(i => !i.marked_for_deletion)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);

  const revokePending = useCallback((list: PendingPreview[]) => {
    list.forEach((p) => URL.revokeObjectURL(p.objectUrl));
  }, []);

  useEffect(() => {
    return () => {
      revokePending(pendingPreviews);
    };
  }, [pendingPreviews, revokePending]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    const fileList = Array.from(files);
    const previews: PendingPreview[] = fileList.map((file) => ({
      id: crypto.randomUUID(),
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setPendingPreviews((prev) => [...prev, ...previews]);
    setUploading(true);

    let lastError: string | null = null;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split(".").pop() || "jpg";
      const storageKey = `${productId}/${crypto.randomUUID()}.${ext}`;

      try {
        const signRes = await fetch("/api/upload-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storage_key: storageKey, content_type: file.type || undefined }),
        });
        if (!signRes.ok) {
          const err = await signRes.json().catch(() => ({ error: "Sign failed" }));
          throw new Error(err.error || "Upload failed");
        }
        const { put_url } = await signRes.json();

        const putRes = await fetch(put_url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type && file.type.length > 0 ? file.type : "application/octet-stream",
          },
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        const result = await registerDraftImage(productId, storageKey);
        if (result.error) {
          lastError = result.error;
          setUploadError(result.error);
        } else if (result.image) {
          setImages((prev) => [...prev, result.image!]);
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Upload failed";
        setUploadError(lastError);
      }

      setPendingPreviews((prev) => {
        const next = prev.filter((p) => p.file !== file);
        const toRevoke = prev.find((p) => p.file === file);
        if (toRevoke) URL.revokeObjectURL(toRevoke.objectUrl);
        return next;
      });
    }

    setUploading(false);
    e.target.value = "";
    if (!lastError && onImagesChange) onImagesChange();
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= images.length) return;
    const newOrder = [...images];
    [newOrder[index], newOrder[next]] = [newOrder[next], newOrder[index]];
    setImages(newOrder);
    
    await reorderDraftImages(
      productId,
      newOrder.map((i) => i.storage_key)
    );
    
    if (onImagesChange) {
      onImagesChange();
    }
  }

  async function remove(storageKey: string) {
    const result = await removeImageFromDraft(productId, storageKey);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    setImages((prev) => prev.filter((i) => i.storage_key !== storageKey));
    
    if (onImagesChange) {
      onImagesChange();
    }
  }

  async function setPrimary(storageKey: string) {
    const result = await updateDraftImage(productId, storageKey, { is_primary: true });
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    setImages((prev) =>
      prev.map((i) => ({ ...i, is_primary: i.storage_key === storageKey }))
    );
    
    if (onImagesChange) {
      onImagesChange();
    }
  }

  async function setShowOnHomepage(storageKey: string, value: boolean) {
    const result = await updateDraftImage(productId, storageKey, { show_on_homepage: value });
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    setImages((prev) =>
      prev.map((i) => ({
        ...i,
        show_on_homepage: i.storage_key === storageKey ? value : false,
      }))
    );
    
    if (onImagesChange) {
      onImagesChange();
    }
  }

  async function updateAltText(storageKey: string, altText: string) {
    const result = await updateDraftImage(productId, storageKey, { alt_text: altText });
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    setImages((prev) =>
      prev.map((i) =>
        i.storage_key === storageKey ? { ...i, alt_text: altText } : i
      )
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Product images
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="px-3 py-1.5 border border-stone-300 rounded text-sm font-medium cursor-pointer hover:bg-stone-50">
            {uploading ? "Uploading…" : "Upload image(s)"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
          {uploadError && (
            <span className="text-sm text-red-600">{uploadError}</span>
          )}
        </div>
        {images.length === 0 && !pendingPreviews.length && (
          <p className="text-sm text-stone-500 mt-2">
            No images. Upload at least one image.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Uploaded images */}
        {images.map((img, index) => (
          <div
            key={img.storage_key}
            className="relative border border-stone-200 rounded overflow-hidden bg-stone-50 w-[140px]"
          >
            <div className="relative group aspect-square">
              <Image
                src={getMediaUrl(img.storage_key)}
                alt={img.alt_text ?? "Product image"}
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
              {img.is_draft_only && (
                <span className="absolute top-1 right-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
                  Draft
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
                  onClick={() => setPrimary(img.storage_key)}
                  className="p-1.5 bg-white rounded text-stone-700"
                  title="Set as primary"
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => remove(img.storage_key)}
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
                onBlur={(e) =>
                  updateAltText(img.storage_key, e.target.value.trim())
                }
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name={`homepage-image-${productId}`}
                  checked={img.show_on_homepage ?? false}
                  onChange={() =>
                    setShowOnHomepage(img.storage_key, !img.show_on_homepage)
                  }
                  className="border-stone-300"
                />
                Homepage
              </label>
            </div>
          </div>
        ))}

        {/* Pending uploads */}
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
                Uploading…
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
