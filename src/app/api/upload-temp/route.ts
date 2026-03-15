import { NextResponse } from "next/server";

/**
 * Legacy temp upload endpoint — no longer accepts file uploads.
 * Use POST /api/upload-sign with body { storage_key, content_type }, then PUT file to put_url.
 * File uploads are now direct browser-to-R2 (presigned PUT); no file passes through the app server.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Use /api/upload-sign to get a presigned PUT URL, then upload the file directly to R2.",
    },
    { status: 410 }
  );
}
