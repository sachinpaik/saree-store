"use server";

import { createClient } from "@/lib/supabase/server";
import { isPreviewModeEnabled } from "@/app/actions/preview-mode";

/**
 * Helper functions to load draft-aware data for storefront pages.
 * 
 * CRITICAL: These functions are used by customer-facing pages.
 * They MUST NEVER throw errors or block page rendering.
 * 
 * Behavior:
 * - Normal users → always get live data
 * - Admin with preview OFF → get live data
 * - Admin with preview ON → get draft-merged data
 * - Auth failure / any error → silently fall back to live data
 * 
 * When admin has preview mode enabled, these functions merge draft changes
 * with live data to show what the product will look like after approval.
 */

type DraftImage = {
  id?: string;
  storage_key: string;
  alt_text?: string | null;
  is_primary?: boolean;
  show_on_homepage?: boolean;
  sort_order: number;
  is_draft_only?: boolean;
  marked_for_deletion?: boolean;
};

type DraftData = {
  product?: Record<string, unknown>;
  images?: DraftImage[];
  attribute_values?: Record<string, string>;
};

/**
 * Load product with draft data if preview mode enabled.
 * 
 * Returns live data for normal users, draft-merged data for admin in preview.
 * NEVER throws - always returns a result object with error field if needed.
 */
export async function loadProductForPreview(productId: string) {
  try {
    const supabase = await createClient();
    
    // Check preview mode (never throws, returns false on any error)
    const previewMode = await isPreviewModeEnabled();
    
    // Load live product
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images(id, storage_key, sort_order, alt_text, is_primary, show_on_homepage)
      `)
      .eq("id", productId)
      .single();
    
    if (error || !product) {
      return { product: null, error: error?.message };
    }
    
    // If not in preview mode, return live product as-is
    if (!previewMode) {
      return { product, error: null };
    }
    
    // Preview mode enabled - try to load and merge draft
    try {
      const { data: draft } = await supabase
        .from("product_drafts")
        .select("draft_data_json, status")
        .eq("product_id", productId)
        .maybeSingle();
      
      // No draft or draft not active, return live product
      if (!draft || (draft.status !== "draft" && draft.status !== "pending")) {
        return { product, error: null };
      }
      
      // Merge draft data into product
      const draftData: DraftData = JSON.parse(draft.draft_data_json || "{}");
      
      console.log("[Preview] Merging draft for product:", productId, {
        hasDraftProduct: !!draftData.product,
        hasDraftImages: !!draftData.images,
        hasDraftAttributes: !!draftData.attribute_values,
        draftProductFields: draftData.product ? Object.keys(draftData.product) : [],
        draftImageCount: draftData.images ? draftData.images.length : 0,
        draftAttributeCount: draftData.attribute_values ? Object.keys(draftData.attribute_values).length : 0,
      });
      
      // Merge draft product fields
      if (draftData.product) {
        Object.assign(product, draftData.product);
      }
      
      // Merge draft attributes
      if (draftData.attribute_values) {
        const productWithAttrs = product as { attributes?: Record<string, unknown> };
        const currentAttributes = productWithAttrs.attributes || {};
        productWithAttrs.attributes = {
          ...currentAttributes,
          ...draftData.attribute_values,
        };
      }
      
      // Merge draft images
      if (draftData.images) {
        const draftImages = draftData.images.filter(i => !i.marked_for_deletion);
        
        console.log("[Preview] Using draft images:", {
          totalDraftImages: draftData.images.length,
          afterFilteringDeleted: draftImages.length,
        });
        
        // Map draft images to product_images format
        (product as { product_images: unknown[] }).product_images = draftImages.map((img, idx) => ({
          id: img.id || `draft-${idx}`,
          storage_key: img.storage_key,
          sort_order: img.sort_order,
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          show_on_homepage: img.show_on_homepage,
        }));
      }
      
      console.log("[Preview] Draft merged successfully");
      
      return { product, error: null };
    } catch (draftError) {
      // Draft loading/merging failed - fall back to live product (fail safe)
      console.error("Preview mode: Failed to load draft, falling back to live:", draftError);
      return { product, error: null };
    }
  } catch (error) {
    // Unexpected error - return error but don't throw
    return { product: null, error: String(error) };
  }
}

/**
 * Load products for collection/list pages with draft data if preview mode.
 * 
 * NEVER throws - always returns a result object with error field if needed.
 */
export async function loadProductsForPreview(filters?: {
  typeId?: string;
  featured?: boolean;
  newArrival?: boolean;
  limit?: number;
}) {
  try {
    const supabase = await createClient();
    
    // Check preview mode (never throws, returns false on any error)
    const previewMode = await isPreviewModeEnabled();
    
    let query = supabase
      .from("products")
      .select(`
        *,
        product_images(id, storage_key, sort_order, alt_text, is_primary, show_on_homepage)
      `)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    
    if (filters?.typeId) {
      query = query.eq("type_id", filters.typeId);
    }
    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }
    if (filters?.newArrival !== undefined) {
      query = query.eq("new_arrival", filters.newArrival);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data: products, error } = await query;
    
    if (error || !products) {
      return { products: [], error: error?.message };
    }
    
    // If not in preview mode, return as-is
    if (!previewMode) {
      return { products, error: null };
    }
    
    // In preview mode, try to merge draft data for each product
    try {
      const productIds = products.map((p: { id: string }) => p.id);
      
      const { data: drafts } = await supabase
        .from("product_drafts")
        .select("product_id, draft_data_json, status")
        .in("product_id", productIds)
        .in("status", ["draft", "pending"]);
      
      if (!drafts || drafts.length === 0) {
        return { products, error: null };
      }
      
      // Create a map of product_id -> draft data
      const draftMap = new Map<string, DraftData>();
      for (const draft of drafts) {
        try {
          const draftData: DraftData = JSON.parse(draft.draft_data_json || "{}");
          draftMap.set(draft.product_id, draftData);
        } catch {
          // Skip invalid draft JSON
          continue;
        }
      }
      
      // Merge draft data into products
      const mergedProducts = products.map((product: { id: string; product_images?: unknown[] }) => {
        const draftData = draftMap.get(product.id);
        if (!draftData) return product;
        
        try {
          // Merge product fields
          if (draftData.product) {
            Object.assign(product, draftData.product);
          }
          
          // Merge attributes
          if (draftData.attribute_values) {
            const productWithAttrs = product as { attributes?: Record<string, unknown> };
            const currentAttributes = productWithAttrs.attributes || {};
            productWithAttrs.attributes = {
              ...currentAttributes,
              ...draftData.attribute_values,
            };
          }
          
          // Merge images
          if (draftData.images) {
            const draftImages = draftData.images.filter(i => !i.marked_for_deletion);
            product.product_images = draftImages.map((img, idx) => ({
              id: img.id || `draft-${idx}`,
              storage_key: img.storage_key,
              sort_order: img.sort_order,
              alt_text: img.alt_text,
              is_primary: img.is_primary,
              show_on_homepage: img.show_on_homepage,
            }));
          }
        } catch {
          // Draft merge failed for this product - return live version
        }
        
        return product;
      });
      
      return { products: mergedProducts, error: null };
    } catch (draftError) {
      // Draft loading/merging failed - fall back to live products (fail safe)
      console.error("Preview mode: Failed to load drafts, falling back to live:", draftError);
      return { products, error: null };
    }
  } catch (error) {
    // Unexpected error - return empty list with error but don't throw
    return { products: [], error: String(error) };
  }
}
