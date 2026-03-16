/**
 * Static storefront types. Public read-only view of approved products.
 * No admin or runtime-only dependencies.
 */

export type ProductImage = {
  id: string;
  storage_key: string;
  sort_order: number;
  alt_text?: string | null;
  is_primary?: boolean;
  show_on_homepage?: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  sku: string | null;
  images: ProductImage[];
  price_inr: number;
  price_aed: number;
  description: string | null;
  stock_status: string;
  show_on_homepage?: boolean;
  attributes?: Record<string, string | number | boolean>;
};

/** Raw row from Supabase (products + product_images). */
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
    sort_order: number;
    alt_text?: string | null;
    is_primary?: boolean;
    show_on_homepage?: boolean;
  }[];
};

export type SiteSettings = {
  homepage_rotation_seconds?: number | null;
  [key: string]: unknown;
};

export type StoreSettings = {
  whatsapp_number: string | null;
  call_number: string | null;
  whatsapp_message_template: string | null;
};
