import { createStorefrontSupabaseClient } from "./supabase.client";
import type {
  AboutContent,
  AboutVideo,
  Product,
  ProductRow,
  SiteSettings,
  StoreSettings,
} from "../types/storefront.types";
import { getCardImageUrl, getVisibleProductImages } from "../../lib/product-image";

const SELECT =
  "id, slug, title, sku, price_inr, price_aed, description, stock_status, show_on_homepage, attributes, product_images(id, storage_key, image_url, original_url, thumb_url, medium_url, large_url, sort_order, alt_text, image_tag, status, width, height, is_primary, show_on_homepage)";

function rowToProduct(row: ProductRow): Product {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      storage_key: img.storage_key,
      image_url: img.image_url ?? null,
      original_url: img.original_url ?? null,
      thumb_url: img.thumb_url ?? null,
      medium_url: img.medium_url ?? null,
      large_url: img.large_url ?? null,
      sort_order: img.sort_order,
      alt_text: img.alt_text ?? null,
      image_tag: img.image_tag ?? null,
      status: img.status ?? "ready",
      width: img.width ?? null,
      height: img.height ?? null,
      is_primary: img.is_primary ?? false,
      show_on_homepage: img.show_on_homepage ?? false,
    }));
  const visibleImages = getVisibleProductImages(images) as Product["images"];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sku: row.sku ?? null,
    images: visibleImages,
    price_inr: row.price_inr ?? 0,
    price_aed: row.price_aed ?? 0,
    description: row.description ?? null,
    stock_status: row.stock_status ?? "in_stock",
    show_on_homepage: row.show_on_homepage ?? false,
    attributes: row.attributes ?? undefined,
  };
}

/**
 * List all approved, non-discontinued products. For static build.
 */
export async function getApprovedProducts(): Promise<Product[]> {
  const supabase = createStorefrontSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("status", "approved")
    .eq("is_discontinued", false)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as ProductRow[]).map(rowToProduct);
}

/**
 * Slugs of all approved products. For generateStaticParams.
 */
export async function getApprovedProductSlugs(): Promise<string[]> {
  const supabase = createStorefrontSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("status", "approved")
    .eq("is_discontinued", false);
  if (error || !data) return [];
  return (data as { slug: string }[]).map((r) => r.slug);
}

/**
 * Single approved product by slug. For static detail page.
 */
export async function getApprovedProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createStorefrontSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("status", "approved")
    .eq("is_discontinued", false)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProduct(data as ProductRow);
}

/**
 * Featured products for homepage (show_on_homepage, limited).
 */
export async function getFeaturedProducts(limit: number): Promise<Product[]> {
  const all = await getApprovedProducts();
  return all.filter((p) => p.show_on_homepage).slice(0, limit);
}

/**
 * Carousel image URLs (direct R2) from featured products. Uses env R2 public base.
 */
export function getCarouselImageUrls(siteSettings: SiteSettings | null, limit: number): string[] {
  const base = getR2PublicBaseUrl();
  if (!base) return [];
  const imageKeys = Array.isArray(siteSettings?.homepage_carousel_image_keys)
    ? siteSettings.homepage_carousel_image_keys
    : [];
  return imageKeys
    .map((key) => String(key ?? "").trim())
    .filter((key) => key.length > 0 && !key.includes(".."))
    .slice(0, limit)
    .map((key) => (key.startsWith("http") ? key : `${base}/${key.replace(/^\/+/, "")}`));
}

function getR2PublicBaseUrl(): string | null {
  if (typeof process === "undefined") return null;
  const base =
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  return base ? String(base).trim().replace(/\/$/, "") || null : null;
}

/**
 * Public image URL for a storage_key. Direct R2; no API route.
 */
export function getPublicImageUrl(storageKey: string): string {
  if (!storageKey || storageKey.includes("..") || storageKey.startsWith("http")) {
    return storageKey.startsWith("http") ? storageKey : "";
  }
  const base = getR2PublicBaseUrl();
  if (!base) return "";
  return `${base}/${storageKey}`;
}

function toPublicFromMaybeKey(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (v.startsWith("http")) return v;
  return getPublicImageUrl(v) || null;
}

export function getProductImageVariantUrl(
  image: {
    thumb_url?: string | null;
    medium_url?: string | null;
    large_url?: string | null;
    storage_key?: string | null;
    image_url?: string | null;
  },
  variant: "thumb" | "medium" | "large"
): string {
  const byVariant =
    variant === "thumb"
      ? [image.thumb_url, image.medium_url, image.large_url]
      : variant === "medium"
        ? [image.medium_url, image.large_url, image.thumb_url]
        : [image.large_url, image.medium_url, image.thumb_url];
  const ordered = [...byVariant, image.storage_key, image.image_url];
  for (const entry of ordered) {
    const url = toPublicFromMaybeKey(entry);
    if (url) return url;
  }
  return "";
}

export function getOptimizedProductImagesForStorefront(images: Product["images"]): Product["images"] {
  return getVisibleProductImages(images) as Product["images"];
}

export function getProductCardImageUrl(product: Product): string {
  const visible = getVisibleProductImages(product.images);
  const first = visible[0];
  return first ? getCardImageUrl(first) : "";
}

/**
 * Site settings (e.g. homepage_rotation_seconds). For static build.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createStorefrontSupabaseClient();
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).single();
  if (error || !data) return null;
  return data as SiteSettings;
}

/**
 * Store settings (WhatsApp, call, template). For static detail page.
 */
export async function getStoreSettings(): Promise<StoreSettings | null> {
  const supabase = createStorefrontSupabaseClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("whatsapp_number, call_number, whatsapp_message_template")
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as StoreSettings;
}

/**
 * Product specs (label -> value) for detail page. Uses attribute_definitions + product_attribute_values.
 */
export async function getProductSpecsForDisplay(
  productId: string,
  productAttributes?: Record<string, string | number | boolean> | null
): Promise<Record<string, string>> {
  const supabase = createStorefrontSupabaseClient();
  const [defsRes, valuesRes] = await Promise.all([
    supabase.from("attribute_definitions").select("key, label").eq("is_active", true),
    supabase.from("product_attribute_values").select("attribute_key, value").eq("product_id", productId),
  ]);
  const defs = (defsRes.data ?? []) as { key: string; label: string }[];
  const values = (valuesRes.data ?? []) as { attribute_key: string; value: string | null }[];
  const keyToLabel = Object.fromEntries(defs.map((d) => [d.key, d.label]));
  const out: Record<string, string> = {};
  for (const row of values) {
    const v = row.value?.trim();
    if (!v) continue;
    out[keyToLabel[row.attribute_key] ?? row.attribute_key] = v;
  }
  if (Object.keys(out).length > 0) return out;
  if (!productAttributes || Object.keys(productAttributes).length === 0) return {};
  for (const [key, val] of Object.entries(productAttributes)) {
    const v = val == null ? "" : String(val).trim();
    if (!v) continue;
    out[keyToLabel[key] ?? key] = v;
  }
  return out;
}

/**
 * About content for storefront.
 * Tries published-only first; falls back to latest record for newer schemas without published column.
 */
export async function getAboutContent(): Promise<AboutContent | null> {
  const supabase = createStorefrontSupabaseClient();
  const publishedAttempt = await supabase
    .from("about_content")
    .select("id, title, intro_text, body_html, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!publishedAttempt.error && publishedAttempt.data) {
    return publishedAttempt.data as AboutContent;
  }

  const { data, error } = await supabase
    .from("about_content")
    .select("id, title, intro_text, body_html, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as AboutContent;
}

/**
 * About videos for storefront.
 * Tries published-only first; falls back to all videos for newer schemas without published column.
 */
export async function getAboutVideos(): Promise<AboutVideo[]> {
  const supabase = createStorefrontSupabaseClient();
  const publishedAttempt = await supabase
    .from("about_videos")
    .select(
      "id, title, description, thumbnail_key, video_360_key, video_720_key, video_1080_key, sort_order, created_at"
    )
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!publishedAttempt.error && publishedAttempt.data) {
    return publishedAttempt.data as AboutVideo[];
  }

  const { data, error } = await supabase
    .from("about_videos")
    .select(
      "id, title, description, thumbnail_key, video_360_key, video_720_key, video_1080_key, sort_order, created_at"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as AboutVideo[];
}
