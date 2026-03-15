import type { StorageProvider } from "./types";
import { r2Provider, getR2PublicUrl } from "@/modules/images/r2Provider";

/**
 * Cloudflare R2 adapter for lib/storage. Delegates to images module R2 provider.
 */
export const cloudflareR2Provider: StorageProvider = {
  ...r2Provider,
  async exists(key: string): Promise<boolean> {
    const h = await r2Provider.head(key);
    return h.exists;
  },
};

export { getR2PublicUrl };
