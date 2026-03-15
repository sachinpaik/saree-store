import { createClient } from "@/lib/supabase/server";
import type { ProductRow } from "./storefront.types";

const SELECT = `
  id, slug, title, sku, price_inr, price_aed, description, stock_status, show_on_homepage, attributes,
  product_images(id, storage_key, sort_order, alt_text, is_primary, show_on_homepage)
`;

/**
 * List approved, non-discontinued products from Supabase. Public storefront read only.
 */
export async function listApprovedProducts(): Promise<ProductRow[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("status", "approved")
      .eq("is_discontinued", false)
      .order("created_at", { ascending: false });
    if (error || !data) return null;
    return data as ProductRow[];
  } catch {
    return null;
  }
}

/**
 * Get one approved product by slug. Public storefront read only.
 */
export async function getApprovedProductBySlug(slug: string): Promise<ProductRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("status", "approved")
      .eq("is_discontinued", false)
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProductRow;
  } catch {
    return null;
  }
}
