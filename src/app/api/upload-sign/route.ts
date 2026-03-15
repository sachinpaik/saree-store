import { NextRequest, NextResponse } from "next/server";
import { getPresignedPutUrl } from "@/modules/images/image.service";

const MAX_KEY_LENGTH = 512;

/**
 * Signer for direct browser-to-R2 uploads (zero-cost: no file through app).
 * POST body: { storage_key: string, content_type?: string }
 * Returns: { put_url: string, storage_key: string }
 * Client then PUTs the file to put_url with Content-Type header.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const storageKey = typeof body.storage_key === "string" ? body.storage_key.trim() : "";
    const contentType = typeof body.content_type === "string" ? body.content_type.trim() : undefined;

    if (!storageKey || storageKey.length > MAX_KEY_LENGTH) {
      return NextResponse.json({ error: "Invalid or missing storage_key" }, { status: 400 });
    }
    if (storageKey.includes("..") || /[<>"|?*]/.test(storageKey)) {
      return NextResponse.json({ error: "Invalid storage_key" }, { status: 400 });
    }
    // Allow temp/<sessionId>/... or <productId>/... (at least two path segments)
    const segments = storageKey.split("/").filter(Boolean);
    const isTemp = storageKey.startsWith("temp/") && segments.length >= 3;
    const isProduct = !storageKey.startsWith("temp/") && segments.length >= 2;
    if (!isTemp && !isProduct) {
      return NextResponse.json({ error: "Storage key must be temp/<session>/<filename> or <productId>/<filename>" }, { status: 400 });
    }

    const { putUrl, storageKey: key } = await getPresignedPutUrl(storageKey, contentType);

    return NextResponse.json({
      put_url: putUrl,
      storage_key: key,
    });
  } catch (error) {
    console.error("Upload sign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign upload" },
      { status: 500 }
    );
  }
}
