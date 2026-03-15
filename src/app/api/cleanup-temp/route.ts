import { NextRequest, NextResponse } from "next/server";
import { cleanupTempUploadsByKeys, cleanupAbandonedTempUploads } from "@/lib/storage/temp-upload-helpers";

/**
 * Cleanup API endpoint for temporary uploads.
 * 
 * Two modes:
 * 1. Cleanup specific temp files by keys (POST with { storage_keys: string[] })
 * 2. Cleanup abandoned temp files older than TTL (POST with { abandoned: true })
 * 
 * Used when:
 * - Admin cancels product creation (mode 1)
 * - Periodic cleanup job runs (mode 2)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Mode 1: Cleanup specific temp files
    if (Array.isArray(body.storage_keys)) {
      const storageKeys = body.storage_keys as string[];
      
      if (storageKeys.length === 0) {
        return NextResponse.json({ 
          deleted: 0,
          message: "No storage keys provided" 
        });
      }

      const deletedCount = await cleanupTempUploadsByKeys(storageKeys);
      
      return NextResponse.json({
        deleted: deletedCount,
        total: storageKeys.length,
        message: `Cleaned up ${deletedCount} of ${storageKeys.length} temp files`,
      });
    }

    // Mode 2: Cleanup abandoned temp files
    if (body.abandoned === true) {
      const ttlHours = typeof body.ttl_hours === "number" 
        ? body.ttl_hours 
        : parseInt(process.env.TEMP_UPLOAD_TTL_HOURS || "24", 10);

      const deletedCount = await cleanupAbandonedTempUploads(ttlHours);
      
      return NextResponse.json({
        deleted: deletedCount,
        ttl_hours: ttlHours,
        message: `Cleaned up ${deletedCount} abandoned temp files older than ${ttlHours} hours`,
      });
    }

    return NextResponse.json(
      { error: "Invalid request. Provide either storage_keys or abandoned: true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Temp cleanup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
