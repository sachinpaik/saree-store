/**
 * Storefront product types. Public read-only view of approved products.
 */

export type SareeImage = {
  id: string;
  storage_key: string;
  image_url?: string | null;
  original_url?: string | null;
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  sort_order: number;
  alt_text?: string | null;
  status?: "uploading" | "processing" | "ready" | "failed";
  width?: number | null;
  height?: number | null;
  is_primary?: boolean;
  show_on_homepage?: boolean;
};

export type Saree = {
  id: string;
  slug: string;
  title: string;
  sku: string | null;
  images: SareeImage[];
  price_inr: number;
  price_aed: number;
  description: string | null;
  stock_status: string;
  show_on_homepage?: boolean;
  attributes?: Record<string, string | number | boolean>;
};

/** Raw row from Supabase products + product_images (repository layer). */
export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  sku?: string | null;
  price_inr?: number;
  price_aed?: number;
  description?: string | null;
  stock_status?: string;
  show_on_homepage?: boolean;
  attributes?: Record<string, string | number | boolean>;
  product_images?: {
    id: string;
    storage_key: string;
    image_url?: string | null;
    original_url?: string | null;
    thumb_url?: string | null;
    medium_url?: string | null;
    large_url?: string | null;
    sort_order: number;
    alt_text?: string | null;
    status?: "uploading" | "processing" | "ready" | "failed";
    width?: number | null;
    height?: number | null;
    is_primary?: boolean;
    show_on_homepage?: boolean;
  }[];
};
