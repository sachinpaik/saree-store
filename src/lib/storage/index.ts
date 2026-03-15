import type { StorageProvider } from "./types";
import { cloudflareR2Provider } from "./cloudflare-r2-provider";
import { supabaseProvider } from "./supabase-provider";
import { localProvider } from "./local-provider";

let cached: StorageProvider | null = null;

/**
 * Storage provider factory.
 * 
 * Supported providers:
 * - cloudflare-r2: Cloudflare R2 (production default)
 * - supabase: Supabase Storage (legacy, still supported)
 * - local: Local filesystem (development only)
 * 
 * Set STORAGE_PROVIDER env var to choose provider.
 * Defaults to cloudflare-r2 for new deployments.
 */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  
  const provider = process.env.STORAGE_PROVIDER ?? "cloudflare-r2";
  
  switch (provider) {
    case "cloudflare-r2":
    case "r2":
      cached = cloudflareR2Provider;
      break;
    case "supabase":
      cached = supabaseProvider;
      break;
    case "local":
      cached = localProvider;
      break;
    default:
      console.warn(`Unknown STORAGE_PROVIDER: ${provider}, falling back to cloudflare-r2`);
      cached = cloudflareR2Provider;
  }
  
  return cached;
}

export type { StorageProvider, HeadResult, DownloadResult, DownloadRangeOpts } from "./types";
