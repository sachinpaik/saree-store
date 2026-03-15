import * as imageService from "@/modules/images/image.service";

/**
 * Storage helper utilities for managing temporary uploads.
 * Temp uploads use keys like: temp/<sessionId>/<filename>.
 * Delegates to images module (R2).
 */

export interface TempUploadMetadata {
  storage_key: string;
  file_name: string;
  uploaded_at: Date;
}

export function generateTempUploadKey(sessionId: string, fileName: string): string {
  const ext = fileName.split(".").pop() || "jpg";
  return `temp/${sessionId}/${crypto.randomUUID()}.${ext}`;
}

export async function finalizeTempUploads(
  productId: string,
  tempStorageKeys: string[]
): Promise<Map<string, string>> {
  const keyMap = new Map<string, string>();

  for (const tempKey of tempStorageKeys) {
    if (!tempKey.startsWith("temp/")) {
      keyMap.set(tempKey, tempKey);
      continue;
    }

    const fileName = tempKey.split("/").pop() || "unknown.jpg";
    const finalKey = `${productId}/${fileName}`;

    try {
      const { stream, contentType } = await imageService.download(tempKey);
      await imageService.upload(finalKey, stream, { contentType: contentType || undefined });
      try {
        await imageService.deleteByKey(tempKey);
      } catch (err) {
        console.warn(`Failed to delete temp file ${tempKey}:`, err);
      }
      keyMap.set(tempKey, finalKey);
    } catch (err) {
      console.error(`Failed to finalize temp upload ${tempKey}:`, err);
      keyMap.set(tempKey, tempKey);
    }
  }

  return keyMap;
}

export async function cleanupTempUploadsForSession(sessionId: string): Promise<number> {
  let deletedCount = 0;
  try {
    const files = await imageService.list(`temp/${sessionId}`);
    for (const file of files) {
      try {
        await imageService.deleteByKey(file);
        deletedCount++;
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error(`Failed to cleanup temp uploads for session ${sessionId}:`, err);
  }
  return deletedCount;
}

export async function cleanupTempUploadsByKeys(storageKeys: string[]): Promise<number> {
  let deletedCount = 0;
  for (const key of storageKeys) {
    if (!key.startsWith("temp/")) continue;
    try {
      await imageService.deleteByKey(key);
      deletedCount++;
    } catch (err) {
      console.warn(`Failed to delete temp file ${key}:`, err);
    }
  }
  return deletedCount;
}

export async function cleanupAbandonedTempUploads(ttlHours: number = 24): Promise<number> {
  const cutoffDate = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
  let deletedCount = 0;
  try {
    const files = await imageService.list("temp");
    for (const file of files) {
      try {
        const { exists, lastModified } = await imageService.head(file);
        if (!exists) continue;
        if (lastModified) {
          const fileDate = new Date(lastModified);
          if (fileDate < cutoffDate) {
            await imageService.deleteByKey(file);
            deletedCount++;
          }
        } else {
          console.warn(`Cannot determine age of temp file ${file}, skipping`);
        }
      } catch (err) {
        console.warn(`Failed to process temp file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error("Failed to cleanup abandoned temp uploads:", err);
  }
  return deletedCount;
}
