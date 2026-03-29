/**
 * Static storefront types. Public read-only view of approved products.
 * No admin or runtime-only dependencies.
 */

export type ProductImage = {
  id: string;
  storage_key: string;
  image_url?: string | null;
  original_url?: string | null;
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  sort_order: number;
  alt_text?: string | null;
  image_tag?: string | null;
  status?: "uploading" | "processing" | "ready" | "failed";
  width?: number | null;
  height?: number | null;
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
  featured?: boolean;
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
  featured?: boolean;
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
    image_tag?: string | null;
    status?: "uploading" | "processing" | "ready" | "failed";
    width?: number | null;
    height?: number | null;
    is_primary?: boolean;
    show_on_homepage?: boolean;
  }[];
};

export type SiteSettings = {
  homepage_rotation_seconds?: number | null;
  homepage_carousel_image_keys?: string[] | null;
  company_logo_key?: string | null;
  [key: string]: unknown;
};

export type StoreSettings = {
  whatsapp_number: string | null;
  call_number: string | null;
  whatsapp_message_template: string | null;
};

export type AboutContent = {
  id: string;
  title: string;
  intro_text: string;
  body_html: string;
  updated_at?: string;
};

export type AboutVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail_key: string | null;
  video_360_key: string | null;
  video_720_key: string | null;
  video_1080_key: string | null;
  sort_order: number;
  created_at?: string;
};
