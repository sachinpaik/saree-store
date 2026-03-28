/**
 * Request a presigned PUT URL for direct browser-to-R2 upload via the upload-signer worker.
 * Requires NEXT_PUBLIC_UPLOAD_SIGNER_URL (no in-app signing).
 */

import { fetchWithRetry } from "@/lib/fetch-retry";
import { createClient } from "@/lib/supabase/client";

export type SignUploadMode = "temp" | "final";

export interface SignUploadResult {
  putUrl: string;
  storageKey: string;
}

/**
 * Get a presigned upload URL from the Cloudflare Worker (POST /sign-upload).
 */
export async function signUploadRequest(
  file: File,
  productId: string,
  mode: SignUploadMode
): Promise<SignUploadResult> {
  const signerUrl = process.env.NEXT_PUBLIC_UPLOAD_SIGNER_URL?.trim();
  if (!signerUrl) {
    throw new Error(
      "NEXT_PUBLIC_UPLOAD_SIGNER_URL is not set. Add your upload-signer worker URL (e.g. https://upload-signer.<account>.workers.dev) to .env.local."
    );
  }

  const contentType =
    file.type && /^(image\/(jpeg|png|gif|webp)|video\/mp4)$/i.test(file.type)
      ? file.type
      : "application/octet-stream";

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not signed in");
  }

  const res = await fetchWithRetry(
    `${signerUrl.replace(/\/$/, "")}/sign-upload`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType,
        productId,
        mode,
      }),
    },
    { maxAttempts: 4, baseDelayMs: 500 }
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      hint?: string;
    };
    const msg = [err.error, err.hint].filter(Boolean).join(" — ") || "Upload sign failed";
    throw new Error(msg);
  }
  const data = (await res.json()) as { putUrl: string; storageKey: string };
  return { putUrl: data.putUrl, storageKey: data.storageKey };
}
