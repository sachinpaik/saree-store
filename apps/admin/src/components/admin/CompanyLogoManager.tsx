"use client";

import { useState } from "react";
import Image from "next/image";
import { getMediaUrl } from "@/lib/media-url";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { signUploadRequest } from "@/lib/upload-signer";

type Props = {
  logoKey: string;
  onChange: (next: string) => void;
};

export function CompanyLogoManager({ logoKey, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { putUrl, storageKey } = await signUploadRequest(file, "company-logo", "final");
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
      onChange(storageKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="px-3 py-1.5 border border-stone-300 rounded text-sm font-medium cursor-pointer hover:bg-stone-50">
          {uploading ? "Uploading..." : logoKey ? "Replace logo" : "Upload logo"}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        {logoKey && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-3 py-1.5 border border-stone-300 rounded text-sm hover:bg-stone-50"
          >
            Remove logo
          </button>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {logoKey ? (
        <div className="inline-flex items-center gap-3 border border-stone-200 rounded p-3 bg-white">
          <div className="relative h-14 w-14 rounded overflow-hidden border border-stone-200 bg-stone-50">
            <Image src={getMediaUrl(logoKey)} alt="Company logo" fill className="object-contain" unoptimized />
          </div>
          <p className="text-xs text-stone-500 break-all max-w-xs">{logoKey}</p>
        </div>
      ) : (
        <p className="text-sm text-stone-500">No logo uploaded. Business name text will be shown.</p>
      )}
    </div>
  );
}
