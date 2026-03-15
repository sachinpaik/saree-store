"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAttributeDefinitions } from "@/lib/data/attribute-definitions";

async function saveProductAttributeValues(
  productId: string,
  formData: FormData,
  definitions: { key: string }[]
): Promise<void> {
  const supabase = await createClient();
  for (const def of definitions) {
    const raw = formData.get(`attr_${def.key}`);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      await supabase
        .from("product_attribute_values")
        .delete()
        .eq("product_id", productId)
        .eq("attribute_key", def.key);
    } else {
      await supabase.from("product_attribute_values").upsert(
        { product_id: productId, attribute_key: def.key, value, updated_at: new Date().toISOString() },
        { onConflict: "product_id,attribute_key" }
      );
    }
  }
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  let definitions: Awaited<ReturnType<typeof getActiveAttributeDefinitions>> = [];
  try {
    definitions = await getActiveAttributeDefinitions();
  } catch {
    // attribute_definitions table may not exist yet
  }

  const title = formData.get("title") as string;
  const slug =
    (formData.get("slug") as string) ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const typeId = (formData.get("type_id") as string) || null;
  const sku = (formData.get("sku") as string) || null;
  const priceInr = parseFloat((formData.get("price_inr") as string) || "0");
  const priceAed = parseFloat((formData.get("price_aed") as string) || "0");
  const description = (formData.get("description") as string) || null;
  const stockStatus = (formData.get("stock_status") as string) || "in_stock";
  const featured = formData.get("featured") === "on";
  const newArrival = formData.get("new_arrival") === "on";
  const showOnHomepage = formData.get("show_on_homepage") === "on";
  const attributesStr = formData.get("attributes") as string | null;
  let attributes: Record<string, string | number | boolean> = {};
  if (attributesStr?.trim()) {
    try {
      attributes = JSON.parse(attributesStr);
    } catch {
      // ignore
    }
  }

  // Get uploaded images data from FormData
  const uploadedImagesStr = formData.get("uploaded_images") as string | null;
  let uploadedImages: Array<{
    storage_key: string;
    alt_text?: string;
    is_primary: boolean;
    show_on_homepage: boolean;
  }> = [];
  if (uploadedImagesStr) {
    try {
      uploadedImages = JSON.parse(uploadedImagesStr);
    } catch {
      // ignore
    }
  }

  // Validate: require at least 1 image for submission
  if (uploadedImages.length === 0) {
    return { error: "At least one product image is required" };
  }

  // Validate required attributes before creating product
  if (definitions.length > 0) {
    for (const def of definitions) {
      if (!def.is_required) continue;
      const raw = formData.get(`attr_${def.key}`);
      const value = typeof raw === "string" ? raw.trim() : "";
      if (!value) return { error: `${def.label} is required` };
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      title,
      slug,
      type_id: typeId || null,
      sku,
      price_inr: priceInr,
      price_aed: priceAed,
      description,
      stock_status: stockStatus,
      featured,
      new_arrival: newArrival,
      show_on_homepage: showOnHomepage,
      attributes,
      name: title,
      product_code: (sku?.trim() || `P-${slug}`) as string,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  const productId = data.id;

  // Link uploaded images to product
  if (uploadedImages.length > 0) {
    const { finalizeTempUploads } = await import("@/modules/images/temp-upload-helpers");

    // Finalize temp uploads (move from temp/ to product/)
    const tempKeys = uploadedImages.map((img) => img.storage_key);
    const keyMap = await finalizeTempUploads(productId, tempKeys);

    for (let i = 0; i < uploadedImages.length; i++) {
      const img = uploadedImages[i];
      const finalStorageKey = keyMap.get(img.storage_key) || img.storage_key;

      // Insert image record
      await supabase.from("product_images").insert({
        product_id: productId,
        storage_key: finalStorageKey,
        alt_text: img.alt_text || null,
        is_primary: img.is_primary,
        show_on_homepage: img.show_on_homepage,
        sort_order: i,
      });
    }
  }

  // Save attribute values
  if (definitions.length > 0) {
    await saveProductAttributeValues(productId, formData, definitions);
  }

  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  let definitions: Awaited<ReturnType<typeof getActiveAttributeDefinitions>> = [];
  try {
    definitions = await getActiveAttributeDefinitions();
  } catch {
    // attribute_definitions table may not exist yet
  }

  if (definitions.length > 0) {
    for (const def of definitions) {
      if (!def.is_required) continue;
      const raw = formData.get(`attr_${def.key}`);
      const value = typeof raw === "string" ? raw.trim() : "";
      if (!value) return { error: `${def.label} is required` };
    }
  }

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || "";
  const typeId = (formData.get("type_id") as string) || null;
  const sku = (formData.get("sku") as string) || null;
  const priceInr = parseFloat((formData.get("price_inr") as string) || "0");
  const priceAed = parseFloat((formData.get("price_aed") as string) || "0");
  const description = (formData.get("description") as string) || null;
  const stockStatus = (formData.get("stock_status") as string) || "in_stock";
  const featured = formData.get("featured") === "on";
  const newArrival = formData.get("new_arrival") === "on";
  const showOnHomepage = formData.get("show_on_homepage") === "on";
  const attributesStr = formData.get("attributes") as string | null;
  let attributes: Record<string, string | number | boolean> = {};
  if (attributesStr?.trim()) {
    try {
      attributes = JSON.parse(attributesStr);
    } catch {
      // ignore
    }
  }
  if (definitions.length > 0) {
    attributes = {};
    for (const def of definitions) {
      const raw = formData.get(`attr_${def.key}`);
      const value = typeof raw === "string" ? raw.trim() : "";
      if (value) attributes[def.key] = value;
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      title,
      slug,
      type_id: typeId || null,
      sku,
      price_inr: priceInr,
      price_aed: priceAed,
      description,
      stock_status: stockStatus,
      featured,
      new_arrival: newArrival,
      show_on_homepage: showOnHomepage,
      attributes,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  if (definitions.length > 0) {
    await saveProductAttributeValues(id, formData, definitions);
  }
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/saree/${slug}`);
  return {};
}

export async function updateProductImageOrder(
  productId: string,
  imageIds: string[]
) {
  const supabase = await createClient();
  for (let i = 0; i < imageIds.length; i++) {
    await supabase
      .from("product_images")
      .update({ sort_order: i })
      .eq("id", imageIds[i])
      .eq("product_id", productId);
  }
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  return {};
}

export async function deleteProductImage(imageId: string, productId: string) {
  const supabase = await createClient();
  
  // First, fetch the image record to get the storage_key
  const { data: imageRecord, error: fetchError } = await supabase
    .from("product_images")
    .select("storage_key")
    .eq("id", imageId)
    .eq("product_id", productId)
    .single();
  
  if (fetchError) {
    return { error: fetchError.message };
  }
  
  if (!imageRecord) {
    return { error: "Image not found" };
  }
  
  const { deleteProductImage } = await import("@/modules/images/image.service");
  const deleteResult = await deleteProductImage(imageRecord.storage_key);
  if (deleteResult?.error) {
    console.error(`Failed to delete storage object ${imageRecord.storage_key}:`, deleteResult.error);
    return { error: deleteResult.error };
  }
  
  // Storage deletion successful, now delete DB row
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);
  
  if (error) {
    console.error(`Storage deleted but DB deletion failed for ${imageRecord.storage_key}:`, error);
    return { error: `Image file deleted but database update failed: ${error.message}` };
  }
  
  // Check if we need to assign a new primary image
  const { data: remainingImages, error: countError } = await supabase
    .from("product_images")
    .select("id, is_primary")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  
  if (!countError && remainingImages && remainingImages.length > 0) {
    // Check if any image is marked as primary
    const hasPrimary = remainingImages.some((img) => img.is_primary);
    
    if (!hasPrimary) {
      // Auto-assign first image as primary
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", remainingImages[0].id);
    }
  }
  
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  return {};
}

/**
 * Register an image in product_images after client has uploaded directly to R2 (presigned PUT).
 * Call after the browser PUTs the file to the presigned URL.
 */
export async function registerProductImage(
  productId: string,
  storageKey: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: maxOrder } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (maxOrder?.sort_order ?? -1) + 1;

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const isFirst = (count ?? 0) === 0;

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_key: storageKey,
    sort_order: sortOrder,
    is_primary: isFirst,
  });

  if (error) return { error: error.message };
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}

/** Legacy: file goes through server. Prefer presigned PUT + registerProductImage. */
export async function uploadProductImage(productId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file?.size) return { error: "No file" };

  const { uploadProductImage: uploadImage } = await import("@/modules/images/image.service");
  const result = await uploadImage(productId, file);
  if ("error" in result) return { error: result.error };
  return registerProductImage(productId, result.storageKey);
}

export async function setPrimaryProductImage(imageId: string, productId: string) {
  const supabase = await createClient();
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) return { error: error.message };
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}

export async function updateProductImage(
  imageId: string,
  productId: string,
  payload: { alt_text?: string | null; show_on_homepage?: boolean }
) {
  const supabase = await createClient();
  if (payload.show_on_homepage === true) {
    await supabase
      .from("product_images")
      .update({ show_on_homepage: false })
      .eq("product_id", productId);
  }
  const { error } = await supabase
    .from("product_images")
    .update(payload)
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) return { error: error.message };
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return {};
}

export type ProductStatus = "draft" | "pending" | "approved" | "rejected";

/** Submit draft product for approval (requires >=1 image). */
export async function submitProductForApproval(productId: string) {
  const supabase = await createClient();
  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("status")
    .eq("id", productId)
    .single();
  if (fetchErr || !product) return { error: fetchErr?.message ?? "Product not found" };
  if ((product as { status?: string }).status !== "draft")
    return { error: "Only draft products can be submitted" };
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if ((count ?? 0) < 1) return { error: "Add at least one image before submitting" };
  const { error } = await supabase
    .from("products")
    .update({ status: "pending", submitted_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  return {};
}

/** Approve a pending (new) product. */
export async function approveProduct(productId: string) {
  const supabase = await createClient();
  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("status, slug")
    .eq("id", productId)
    .single();
  if (fetchErr || !product) return { error: fetchErr?.message ?? "Product not found" };
  if ((product as { status?: string }).status !== "pending") return { error: "Product is not pending" };
  const { error } = await supabase
    .from("products")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  const slug = (product as { slug?: string }).slug;
  if (slug) revalidatePath(`/saree/${slug}`);
  return {};
}

/** Reject a pending product. */
export async function rejectProduct(productId: string, rejectionReason: string) {
  const supabase = await createClient();
  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("status")
    .eq("id", productId)
    .single();
  if (fetchErr || !product) return { error: fetchErr?.message ?? "Product not found" };
  if ((product as { status?: string }).status !== "pending") return { error: "Product is not pending" };
  const reason = rejectionReason?.trim() || null;
  const { error } = await supabase
    .from("products")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  return {};
}

/** Discontinue product (soft hide from customers). */
export async function discontinueProduct(
  productId: string,
  reason: string | null
) {
  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();
  const { error } = await supabase
    .from("products")
    .update({
      is_discontinued: true,
      discontinued_at: new Date().toISOString(),
      discontinued_reason: reason?.trim() || null,
    })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  const slug = row ? (row as { slug?: string }).slug : undefined;
  if (slug) revalidatePath(`/saree/${slug}`);
  return {};
}

/** Re-enable a discontinued product. */
export async function reEnableProduct(productId: string) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();
  const { error } = await supabase
    .from("products")
    .update({
      is_discontinued: false,
      discontinued_at: null,
      discontinued_reason: null,
    })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  const slug = row ? (row as { slug?: string }).slug : undefined;
  if (slug) revalidatePath(`/saree/${slug}`);
  return {};
}

type DraftData = {
  product?: Record<string, unknown>;
  images?: { storage_key: string; alt_text?: string | null; is_primary?: boolean; show_on_homepage?: boolean; sort_order: number }[];
  attribute_values?: Record<string, string>;
};

/** Save or update draft for an approved product (edits go to draft, not live). */
export async function saveProductDraft(productId: string, draftData: DraftData) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_drafts").upsert(
    {
      product_id: productId,
      status: "draft",
      draft_data_json: JSON.stringify(draftData),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}/edit`);
  return {};
}

/** Submit draft for approval. */
export async function submitDraftForApproval(productId: string) {
  const supabase = await createClient();
  const { data: draft, error: fetchErr } = await supabase
    .from("product_drafts")
    .select("id")
    .eq("product_id", productId)
    .single();
  if (fetchErr || !draft) return { error: "No draft found" };
  const { error } = await supabase
    .from("product_drafts")
    .update({
      status: "pending",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}/edit`);
  return {};
}

/** Apply draft to live product and mark draft approved. */
export async function approveDraft(productId: string) {
  const supabase = await createClient();
  const { data: draft, error: fetchErr } = await supabase
    .from("product_drafts")
    .select("draft_data_json")
    .eq("product_id", productId)
    .single();
  if (fetchErr || !draft) return { error: "Draft not found" };
  
  // Define DraftData inline to avoid circular imports
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
  
  const data = JSON.parse((draft as { draft_data_json: string }).draft_data_json || "{}") as DraftData;
  
  console.log("[approveDraft] Approving draft for product:", productId, {
    hasProductFields: !!data.product,
    productFields: data.product ? Object.keys(data.product) : [],
    hasImages: !!data.images,
    imageCount: data.images ? data.images.length : 0,
    hasAttributeValues: !!data.attribute_values,
    attributeCount: data.attribute_values ? Object.keys(data.attribute_values).length : 0,
  });
  
  // Update product fields if present in draft
  if (data.product) {
    const p = data.product as Record<string, unknown>;
    
    console.log("[approveDraft] Updating product fields");
    
    await supabase.from("products").update({
      title: p.title ?? undefined,
      name: p.name ?? undefined,
      product_code: p.product_code ?? undefined,
      slug: p.slug ?? undefined,
      type_id: p.type_id ?? undefined,
      sku: p.sku ?? undefined,
      price_inr: p.price_inr ?? undefined,
      price_aed: p.price_aed ?? undefined,
      description: p.description ?? undefined,
      stock_status: p.stock_status ?? undefined,
      featured: p.featured ?? undefined,
      new_arrival: p.new_arrival ?? undefined,
      show_on_homepage: p.show_on_homepage ?? undefined,
      // Merge draft attributes with product attributes field
      attributes: data.attribute_values 
        ? { ...((p.attributes as Record<string, unknown>) || {}), ...data.attribute_values }
        : (p.attributes ?? undefined),
      updated_at: new Date().toISOString(),
    }).eq("id", productId);
  }
  
  // Handle image updates from draft
  if (data.images) {
    console.log("[approveDraft] Syncing images");
    
    const { deleteByKey } = await import("@/modules/images/image.service");
    
    // Get current live images
    const { data: liveImages } = await supabase
      .from("product_images")
      .select("id, storage_key")
      .eq("product_id", productId);
    
    const liveImageKeys = new Set((liveImages || []).map(i => i.storage_key));
    const draftImages = data.images.filter(i => !i.marked_for_deletion);
    const draftImageKeys = new Set(draftImages.map(i => i.storage_key));
    
    console.log("[approveDraft] Image sync:", {
      liveImageCount: liveImages?.length || 0,
      draftImageCount: draftImages.length,
      imagesToDelete: (liveImages || []).filter(i => !draftImageKeys.has(i.storage_key)).length,
    });
    
    // Delete images marked for deletion (live images no longer in draft)
    const imagesToDelete = (liveImages || []).filter(i => !draftImageKeys.has(i.storage_key));
    for (const img of imagesToDelete) {
      console.log("[approveDraft] Deleting image:", img.storage_key);
      try {
        await deleteByKey(img.storage_key);
      } catch (err) {
        console.error(`Failed to delete image ${img.storage_key}:`, err);
      }
      
      // Delete from database
      await supabase
        .from("product_images")
        .delete()
        .eq("id", img.id);
    }
    
    // Update or insert draft images
    for (const draftImage of draftImages) {
      if (draftImage.id) {
        console.log("[approveDraft] Updating existing image:", draftImage.storage_key);
        
        // Update existing image
        await supabase
          .from("product_images")
          .update({
            alt_text: draftImage.alt_text,
            is_primary: draftImage.is_primary,
            show_on_homepage: draftImage.show_on_homepage,
            sort_order: draftImage.sort_order,
          })
          .eq("id", draftImage.id);
      } else {
        console.log("[approveDraft] Inserting new draft-only image:", draftImage.storage_key);
        
        // Insert new image (draft-only images)
        await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            storage_key: draftImage.storage_key,
            alt_text: draftImage.alt_text,
            is_primary: draftImage.is_primary,
            show_on_homepage: draftImage.show_on_homepage,
            sort_order: draftImage.sort_order,
          });
      }
    }
  }
  
  // Sync attribute values to product_attribute_values table
  if (data.attribute_values && Object.keys(data.attribute_values).length > 0) {
    console.log("[approveDraft] Syncing attribute values:", Object.keys(data.attribute_values).length);
    
    for (const [key, value] of Object.entries(data.attribute_values)) {
      if (!value?.trim()) {
        console.log("[approveDraft] Deleting empty attribute:", key);
        
        await supabase
          .from("product_attribute_values")
          .delete()
          .eq("product_id", productId)
          .eq("attribute_key", key);
      } else {
        console.log("[approveDraft] Upserting attribute:", key, "=", value);
        
        await supabase.from("product_attribute_values").upsert(
          { product_id: productId, attribute_key: key, value, updated_at: new Date().toISOString() },
          { onConflict: "product_id,attribute_key" }
        );
      }
    }
  }
  await supabase
    .from("product_drafts")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  const { data: productRow } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();
  const slug = productRow ? (productRow as { slug?: string }).slug : undefined;
  if (slug) revalidatePath(`/saree/${slug}`);
  return {};
}

/** Reject draft with reason. */
export async function rejectDraft(productId: string, rejectionReason: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_drafts")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}/edit`);
  return {};
}

/** Permanently delete product (admin only). Requires confirmation = product_code or "DELETE". */
export async function deleteProductPermanently(
  productId: string,
  productCode: string,
  confirmation: string
) {
  const trimmed = confirmation?.trim();
  if (trimmed !== productCode && trimmed !== "DELETE")
    return { error: "Type the product code or DELETE to confirm" };

  const supabase = await createClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_key")
    .eq("product_id", productId);

  await supabase.from("product_drafts").delete().eq("product_id", productId);
  await supabase.from("product_attribute_values").delete().eq("product_id", productId);
  await supabase.from("product_images").delete().eq("product_id", productId);
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: error.message };

  const keys = (images ?? []).map((r) => (r as { storage_key: string }).storage_key);
  const { deleteByKey } = await import("@/modules/images/image.service");
  for (const key of keys) {
    try {
      await deleteByKey(key);
    } catch {
      // best-effort
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  return { deleted: true };
}
