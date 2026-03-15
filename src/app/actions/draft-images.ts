"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Draft-aware image management actions for product edit page.
 * 
 * These actions handle image uploads/deletions in draft mode safely:
 * - New uploads go directly to product folder (not temp)
 * - Images are tracked in draft state immediately
 * - Deletions of live images are deferred until draft approval
 * - Deletions of draft-only images can happen immediately
 */

export type DraftImage = {
  id?: string; // DB id if it's a live image
  storage_key: string;
  alt_text?: string | null;
  is_primary?: boolean;
  show_on_homepage?: boolean;
  sort_order: number;
  is_draft_only?: boolean; // true if uploaded in draft mode
  marked_for_deletion?: boolean; // true if admin removed it in draft
};

export type DraftData = {
  product?: Record<string, unknown>;
  images?: DraftImage[];
  attribute_values?: Record<string, string>;
};

/**
 * Get or create draft for a product.
 * Called automatically when edit page loads.
 */
export async function getOrCreateDraft(productId: string): Promise<{
  draft: DraftData | null;
  draftExists: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  // Check if draft already exists
  const { data: existingDraft, error: fetchError } = await supabase
    .from("product_drafts")
    .select("draft_data_json, status")
    .eq("product_id", productId)
    .maybeSingle();
  
  if (fetchError) {
    return { draft: null, draftExists: false, error: fetchError.message };
  }
  
  // If draft exists and is not approved/rejected, return it
  if (existingDraft && 
      (existingDraft.status === "draft" || existingDraft.status === "pending")) {
    const draftData = JSON.parse(existingDraft.draft_data_json || "{}") as DraftData;
    return { draft: draftData, draftExists: true };
  }
  
  // No active draft found, get live product data to initialize draft
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(`
      *,
      product_images(id, storage_key, sort_order, alt_text, is_primary, show_on_homepage)
    `)
    .eq("id", productId)
    .single();
  
  if (productError || !product) {
    return { draft: null, draftExists: false, error: "Product not found" };
  }
  
  // Initialize draft with live product data
  const images = ((product as { product_images?: unknown[] }).product_images ?? []) as Array<{
    id: string;
    storage_key: string;
    sort_order: number;
    alt_text?: string | null;
    is_primary?: boolean;
    show_on_homepage?: boolean;
  }>;
  
  const initialDraft: DraftData = {
    product: {
      title: (product as { title?: string }).title,
      name: (product as { name?: string }).name,
      product_code: (product as { product_code?: string }).product_code,
      slug: (product as { slug?: string }).slug,
      type_id: (product as { type_id?: string | null }).type_id,
      sku: (product as { sku?: string | null }).sku,
      price_inr: (product as { price_inr?: number }).price_inr,
      price_aed: (product as { price_aed?: number }).price_aed,
      description: (product as { description?: string | null }).description,
      stock_status: (product as { stock_status?: string }).stock_status,
      featured: (product as { featured?: boolean }).featured,
      new_arrival: (product as { new_arrival?: boolean }).new_arrival,
      show_on_homepage: (product as { show_on_homepage?: boolean }).show_on_homepage,
      attributes: (product as { attributes?: Record<string, unknown> }).attributes,
    },
    images: images.map((img) => ({
      id: img.id,
      storage_key: img.storage_key,
      alt_text: img.alt_text,
      is_primary: img.is_primary,
      show_on_homepage: img.show_on_homepage,
      sort_order: img.sort_order,
      is_draft_only: false,
      marked_for_deletion: false,
    })),
  };
  
  return { draft: initialDraft, draftExists: false };
}

/**
 * Register an image in the draft after client has uploaded directly to R2 (presigned PUT).
 * Call this after the browser PUTs the file to the presigned URL; no file passes through the server.
 */
export async function registerDraftImage(
  productId: string,
  storageKey: string
): Promise<{ image?: DraftImage; error?: string }> {
  const supabase = await createClient();

  const { data: draftRow, error: fetchError } = await supabase
    .from("product_drafts")
    .select("draft_data_json")
    .eq("product_id", productId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };

  const draftData: DraftData = draftRow
    ? JSON.parse(draftRow.draft_data_json || "{}")
    : {};
  const existingImages = draftData.images || [];
  const nextSortOrder =
    existingImages.length > 0
      ? Math.max(...existingImages.map((i) => i.sort_order)) + 1
      : 0;
  const isFirst = existingImages.filter((i) => !i.marked_for_deletion).length === 0;

  const newImage: DraftImage = {
    storage_key: storageKey,
    alt_text: null,
    is_primary: isFirst,
    show_on_homepage: false,
    sort_order: nextSortOrder,
    is_draft_only: true,
    marked_for_deletion: false,
  };

  draftData.images = [...existingImages, newImage];

  const { error: upsertError } = await supabase.from("product_drafts").upsert(
    {
      product_id: productId,
      status: "draft",
      draft_data_json: JSON.stringify(draftData),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );

  if (upsertError) return { error: upsertError.message };

  revalidatePath(`/admin/products/${productId}/edit`);
  return { image: newImage };
}

/**
 * Upload image during product edit (draft mode) — legacy path: file goes through server.
 * Prefer: client gets presigned URL, PUTs to R2, then calls registerDraftImage.
 */
export async function uploadImageToDraft(
  productId: string,
  formData: FormData
): Promise<{ image?: DraftImage; error?: string }> {
  const file = formData.get("file") as File;
  if (!file?.size) return { error: "No file provided" };
  if (!file.type.startsWith("image/")) return { error: "Only image files are allowed" };
  if (file.size > 10 * 1024 * 1024) return { error: "File size must be less than 10MB" };

  const { uploadProductImage } = await import("@/modules/images/image.service");
  const uploadResult = await uploadProductImage(productId, file);
  if ("error" in uploadResult) return { error: uploadResult.error };
  return registerDraftImage(productId, uploadResult.storageKey);
}

/**
 * Remove image from draft (marks for deletion or deletes immediately).
 * - If image is live: marks for deletion in draft
 * - If image is draft-only: physically deletes from storage
 */
export async function removeImageFromDraft(
  productId: string,
  storageKey: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  // Get current draft
  const { data: draftRow, error: fetchError } = await supabase
    .from("product_drafts")
    .select("draft_data_json")
    .eq("product_id", productId)
    .single();
  
  if (fetchError || !draftRow) {
    return { error: "Draft not found" };
  }
  
  const draftData: DraftData = JSON.parse(draftRow.draft_data_json || "{}");
  const images = draftData.images || [];
  
  const imageToRemove = images.find(i => i.storage_key === storageKey);
  
  if (!imageToRemove) {
    return { error: "Image not found in draft" };
  }
  
  // If image is draft-only (uploaded but never approved), physically delete it
  if (imageToRemove.is_draft_only) {
    const { deleteProductImage } = await import("@/modules/images/image.service");
    const deleteResult = await deleteProductImage(storageKey);
    if (deleteResult?.error) {
      console.error(`Failed to delete draft-only image ${storageKey}:`, deleteResult.error);
      return { error: deleteResult.error };
    }
    
    // Remove from draft completely
    draftData.images = images.filter(i => i.storage_key !== storageKey);
  } else {
    // Image is live, just mark for deletion in draft
    draftData.images = images.map(i => 
      i.storage_key === storageKey 
        ? { ...i, marked_for_deletion: true }
        : i
    );
  }
  
  // Check if we need to reassign primary
  const remainingImages = draftData.images.filter(i => !i.marked_for_deletion);
  const hasPrimary = remainingImages.some(i => i.is_primary);
  
  if (!hasPrimary && remainingImages.length > 0 && draftData.images) {
    // Auto-assign first remaining image as primary
    const imagesToUpdate = draftData.images;
    draftData.images = imagesToUpdate.map((i, idx) => {
      if (i.marked_for_deletion) return i;
      const isFirst = imagesToUpdate
        .slice(0, idx)
        .every(img => img.marked_for_deletion || img.storage_key === i.storage_key);
      return { ...i, is_primary: isFirst };
    });
  }
  
  // Update draft
  const { error: updateError } = await supabase.from("product_drafts").update({
    draft_data_json: JSON.stringify(draftData),
    updated_at: new Date().toISOString(),
  }).eq("product_id", productId);
  
  if (updateError) {
    return { error: updateError.message };
  }
  
  revalidatePath(`/admin/products/${productId}/edit`);
  
  return {};
}

/**
 * Update draft image metadata (alt text, primary, homepage).
 */
export async function updateDraftImage(
  productId: string,
  storageKey: string,
  updates: {
    alt_text?: string | null;
    is_primary?: boolean;
    show_on_homepage?: boolean;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  const { data: draftRow, error: fetchError } = await supabase
    .from("product_drafts")
    .select("draft_data_json")
    .eq("product_id", productId)
    .single();
  
  if (fetchError || !draftRow) {
    return { error: "Draft not found" };
  }
  
  const draftData: DraftData = JSON.parse(draftRow.draft_data_json || "{}");
  const images = draftData.images || [];
  
  // Update image
  draftData.images = images.map(i => {
    if (i.storage_key === storageKey) {
      return { ...i, ...updates };
    }
    // If setting this as primary or homepage, unset others
    if (updates.is_primary && i.is_primary) {
      return { ...i, is_primary: false };
    }
    if (updates.show_on_homepage && i.show_on_homepage) {
      return { ...i, show_on_homepage: false };
    }
    return i;
  });
  
  const { error: updateError } = await supabase.from("product_drafts").update({
    draft_data_json: JSON.stringify(draftData),
    updated_at: new Date().toISOString(),
  }).eq("product_id", productId);
  
  if (updateError) {
    return { error: updateError.message };
  }
  
  revalidatePath(`/admin/products/${productId}/edit`);
  
  return {};
}

/**
 * Reorder images in draft.
 */
export async function reorderDraftImages(
  productId: string,
  storageKeys: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  
  const { data: draftRow, error: fetchError } = await supabase
    .from("product_drafts")
    .select("draft_data_json")
    .eq("product_id", productId)
    .single();
  
  if (fetchError || !draftRow) {
    return { error: "Draft not found" };
  }
  
  const draftData: DraftData = JSON.parse(draftRow.draft_data_json || "{}");
  const images = draftData.images || [];
  
  // Create a map for quick lookup
  const imageMap = new Map(images.map(i => [i.storage_key, i]));
  
  // Reorder based on provided keys
  draftData.images = storageKeys.map((key, index) => {
    const img = imageMap.get(key);
    if (!img) throw new Error(`Image ${key} not found`);
    return { ...img, sort_order: index };
  });
  
  const { error: updateError } = await supabase.from("product_drafts").update({
    draft_data_json: JSON.stringify(draftData),
    updated_at: new Date().toISOString(),
  }).eq("product_id", productId);
  
  if (updateError) {
    return { error: updateError.message };
  }
  
  revalidatePath(`/admin/products/${productId}/edit`);
  
  return {};
}
