"use client";

import { useState } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media-url";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { signUploadRequest } from "@/lib/upload-signer";

type Props = {
  imageKeys: string[];
  onChange: (next: string[]) => void;
};

export function HomepageCarouselImageManager({ imageKeys, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setError(null);
    setUploading(true);
    const keysToAdd: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const { putUrl, storageKey } = await signUploadRequest(file, "homepage-carousel", "final");
        const putRes = await fetchWithRetry(
          putUrl,
          {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type && file.type.length > 0 ? file.type : "application/octet-stream",
            },
          },
          { maxAttempts: 4, baseDelayMs: 500 }
        );
        if (!putRes.ok) throw new Error("Upload failed");
        keysToAdd.push(storageKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }

    if (keysToAdd.length > 0) {
      onChange([...imageKeys, ...keysToAdd]);
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeAt(index: number) {
    onChange(imageKeys.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= imageKeys.length) return;
    const next = [...imageKeys];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="px-3 py-1.5 border border-stone-300 rounded text-sm font-medium cursor-pointer hover:bg-stone-50">
          {uploading ? "Uploading..." : "Upload carousel image(s)"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {imageKeys.length === 0 && (
        <p className="text-sm text-stone-500">
          No carousel images uploaded yet.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {imageKeys.map((key, index) => (
          <div
            key={key}
            className="relative border border-stone-200 rounded overflow-hidden bg-stone-50 w-[160px]"
          >
            <div className="relative group aspect-[4/5]">
              <Image
                src={getMediaUrl(key)}
                alt=""
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
              <span className="absolute top-1 left-1 text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 bg-white rounded text-stone-700 disabled:opacity-50"
                  title="Move left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === imageKeys.length - 1}
                  className="p-1.5 bg-white rounded text-stone-700 disabled:opacity-50"
                  title="Move right"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="p-1.5 bg-red-600 text-white rounded"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-2">
              <p className="text-[11px] text-stone-500 truncate" title={key}>
                {key}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
