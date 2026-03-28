export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  id: string;
  whatsapp_number: string | null;
  call_number: string | null;
  whatsapp_message_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  business_name: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  address_text: string | null;
  instagram_url: string | null;
  support_hours: string | null;
  homepage_rotation_seconds: number | null;
  homepage_carousel_image_keys: string[];
  company_logo_key: string | null;
  updated_at: string;
}

export interface Type {
  id: string;
  slug: string;
  name: string;
  banner_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type StockStatus = "in_stock" | "out_of_stock" | "low_stock";

export interface Product {
  id: string;
  type_id: string | null;
  slug: string;
  title: string;
  sku: string | null;
  price_inr: number;
  price_aed: number;
  description: string | null;
  attributes: Record<string, string | number | boolean>;
  stock_status: StockStatus;
  featured: boolean;
  new_arrival: boolean;
  show_on_homepage?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
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
  created_at: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  types: Type | null;
}

export interface TypeWithProducts extends Type {
  products?: ProductWithImages[];
}

export interface AboutContent {
  id: string;
  title: string;
  intro_text: string;
  body_html: string;
  updated_at: string;
}

export interface AboutVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_key: string | null;
  video_360_key: string | null;
  video_720_key: string | null;
  video_1080_key: string | null;
  sort_order: number;
  created_at: string;
}
