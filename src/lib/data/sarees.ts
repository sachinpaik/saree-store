import type { Saree } from "@/lib/types";
import {
  listProducts,
  getProductBySlug,
  getCarouselImageUrls as getCarouselUrls,
  listProductsForHomepage as listForHomepage,
} from "@/modules/storefront/storefront.service";

export async function listSarees(): Promise<Saree[]> {
  return listProducts();
}

export async function listSareesPreview(limit: number): Promise<Saree[]> {
  const all = await listProducts();
  return all.slice(0, limit);
}

export async function getSareeBySlug(slug: string): Promise<Saree | null> {
  return getProductBySlug(slug);
}

export async function getCarouselImageUrls(limit: number): Promise<string[]> {
  return getCarouselUrls(limit);
}

export async function listSareesForHomepage(limit: number): Promise<Saree[]> {
  return listForHomepage(limit);
}
