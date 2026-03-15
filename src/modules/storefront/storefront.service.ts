import { getProductImageUrl } from "@/modules/images/image.service";
import { listApprovedProducts, getApprovedProductBySlug } from "./storefront.repository";
import type { Saree, SareeImage, ProductRow } from "./storefront.types";

function rowToSaree(p: ProductRow): Saree {
  const images = (p.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      storage_key: img.storage_key,
      sort_order: img.sort_order,
      alt_text: img.alt_text ?? null,
      is_primary: img.is_primary ?? false,
      show_on_homepage: img.show_on_homepage ?? false,
    })) as SareeImage[];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    sku: p.sku ?? null,
    images,
    price_inr: p.price_inr ?? 0,
    price_aed: p.price_aed ?? 0,
    description: p.description ?? null,
    stock_status: p.stock_status ?? "in_stock",
    show_on_homepage: p.show_on_homepage ?? false,
    attributes: p.attributes ?? undefined,
  };
}

function pickHomepageImage(saree: Saree): SareeImage | undefined {
  const showOnHome = saree.images.find((img) => img.show_on_homepage);
  if (showOnHome) return showOnHome;
  const primary = saree.images.find((img) => img.is_primary);
  if (primary) return primary;
  return saree.images[0];
}

/** List all approved products for storefront. Uses Supabase only; no custom API. */
export async function listProducts(): Promise<Saree[]> {
  const rows = await listApprovedProducts();
  if (rows && rows.length > 0) return rows.map(rowToSaree);
  return [];
}

/** Get one approved product by slug. */
export async function getProductBySlug(slug: string): Promise<Saree | null> {
  const row = await getApprovedProductBySlug(slug);
  if (!row) return null;
  return rowToSaree(row);
}

/** Carousel image URLs (direct R2/public when configured). Only show_on_homepage products. */
export async function getCarouselImageUrls(limit: number): Promise<string[]> {
  const list = await listProducts();
  const urls: string[] = [];
  for (const s of list) {
    if (!s.show_on_homepage) continue;
    const img = pickHomepageImage(s);
    if (img?.storage_key && urls.length < limit) urls.push(getProductImageUrl(img.storage_key));
  }
  return urls;
}

/** Homepage grid: show_on_homepage products with single image (homepage or primary or first). */
export async function listProductsForHomepage(limit: number): Promise<Saree[]> {
  const list = await listProducts();
  return list
    .filter((s) => s.show_on_homepage)
    .slice(0, limit)
    .map((s) => ({
      ...s,
      images: pickHomepageImage(s) ? [pickHomepageImage(s)!] : [],
    }));
}
