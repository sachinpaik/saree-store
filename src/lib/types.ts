export type SareeImage = {
  id: string;
  storage_key: string;
  sort_order: number;
  alt_text?: string | null;
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
  /** Key-value specs for ProductSpecifications (e.g. Fabric, Technique, Border) */
  attributes?: Record<string, string | number | boolean>;
};
