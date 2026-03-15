"use client";

import { useState, forwardRef, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProduct, updateProduct, saveProductDraft } from "@/app/actions/products";
import { ProductImageManager } from "./ProductImageManager";
import { ProductImageUploader } from "./ProductImageUploader";
import { DraftImageManager } from "./DraftImageManager";
import { parseSelectOptions, type AttributeDefinition } from "@/lib/data/attribute-definitions-shared";

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

type Type = { id: string; name: string; slug: string };
type Image = {
  id: string;
  storage_key: string;
  sort_order: number;
  alt_text?: string | null;
  is_primary?: boolean;
  show_on_homepage?: boolean;
};

type UploadedImage = {
  tempId: string;
  storage_key: string;
  file_name: string;
  alt_text?: string;
  is_primary: boolean;
  show_on_homepage: boolean;
};

type Product = {
  id: string;
  slug: string;
  title: string;
  type_id: string | null;
  sku: string | null;
  price_inr: number;
  price_aed: number;
  description: string | null;
  stock_status: string;
  featured: boolean;
  new_arrival: boolean;
  show_on_homepage?: boolean;
  attributes: Record<string, unknown>;
  product_images?: Image[];
  status?: string;
};

type ProductFormProps = {
  types: Type[];
  product?: Product;
  attributeDefinitions?: AttributeDefinition[];
  attributeValues?: Record<string, string>;
  inactiveDefinitions?: AttributeDefinition[];
  id?: string;
  hideActions?: boolean;
  onSavingChange?: (saving: boolean) => void;
  onSaveSuccess?: (message: string) => void;
  draftImages?: DraftImage[];
  onImagesChange?: () => void;
};

export const ProductForm = forwardRef<HTMLFormElement, ProductFormProps>(function ProductForm(
  {
    types,
    product,
    attributeDefinitions = [],
    attributeValues = {},
    inactiveDefinitions = [],
    id,
    hideActions = false,
    onSavingChange,
    onSaveSuccess,
    draftImages,
    onImagesChange,
  },
  ref
) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInactiveAttributes, setShowInactiveAttributes] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const uploaderRef = useRef<HTMLDivElement | null>(null);
  const isEdit = !!product;

  // Generate a stable session ID for this form instance
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const attrsStr =
    product?.attributes && Object.keys(product.attributes).length > 0
      ? JSON.stringify(product.attributes, null, 2)
      : "{}";

  const byGroup = attributeDefinitions.reduce<Record<string, AttributeDefinition[]>>((acc, def) => {
    const g = def.group || "Specifications";
    if (!acc[g]) acc[g] = [];
    acc[g].push(def);
    return acc;
  }, {});

  const handleImagesChange = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
  }, []);

  // Cleanup temp uploads (server action; no API route)
  const cleanupTempUploads = useCallback(async () => {
    if (!isEdit && uploadedImages.length > 0) {
      const storageKeys = uploadedImages.map((img) => img.storage_key);
      try {
        const { cleanupTempUploadsByKeysAction } = await import("@/app/actions/cleanup-temp");
        await cleanupTempUploadsByKeysAction(storageKeys);
      } catch (err) {
        console.warn("Failed to cleanup temp uploads:", err);
      }
    }
  }, [isEdit, uploadedImages]);

  // Handle cancel button - cleanup and navigate
  const handleCancel = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isEdit && uploadedImages.length > 0) {
      e.preventDefault();
      
      // Call cleanup from uploader component if available
      const uploaderDiv = uploaderRef.current;
      if (uploaderDiv) {
        const cleanupFn = uploaderDiv.getAttribute("data-cleanup");
        if (cleanupFn) {
          try {
            // Get the cleanup function from the component
            const cleanup = (uploaderDiv as { dataset?: { cleanup?: () => Promise<void> } }).dataset?.cleanup;
            if (cleanup) {
              await cleanup();
            }
          } catch (err) {
            console.warn("Cleanup error:", err);
          }
        }
      }
      
      // Fallback: cleanup directly
      await cleanupTempUploads();
      
      // Navigate after cleanup
      router.push("/admin/products");
    }
  }, [isEdit, uploadedImages, cleanupTempUploads, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate images for new products
    if (!isEdit && uploadedImages.length === 0) {
      setError("At least one product image is required");
      return;
    }

    setLoading(true);
    onSavingChange?.(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add uploaded images data to formData for new products
    if (!isEdit && uploadedImages.length > 0) {
      formData.set("uploaded_images", JSON.stringify(uploadedImages));
    }

    if (isEdit && product?.status === "approved") {
      const title = (formData.get("title") as string) ?? "";
      const sku = (formData.get("sku") as string) ?? "";
      
      // Collect attribute values from form (active attributes)
      const formAttributeValues = attributeDefinitions.reduce<Record<string, string>>((acc, def) => {
        const v = (formData.get(`attr_${def.key}`) as string)?.trim() ?? "";
        if (v) acc[def.key] = v;
        return acc;
      }, {});
      
      // Also collect values from inactive attributes if they have form fields
      const inactiveAttributeValues = inactiveDefinitions.reduce<Record<string, string>>((acc, def) => {
        const v = (formData.get(`attr_${def.key}`) as string)?.trim() ?? "";
        if (v) acc[def.key] = v;
        return acc;
      }, {});
      
      // Preserve existing attribute values that aren't in the form
      // This ensures we don't lose values for attributes that are now inactive
      const preservedValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(attributeValues)) {
        if (!formAttributeValues[key] && !inactiveAttributeValues[key] && value) {
          preservedValues[key] = value;
        }
      }
      
      // Merge all attribute values (form values take precedence)
      const allAttributeValues = {
        ...preservedValues,
        ...formAttributeValues,
        ...inactiveAttributeValues,
      };
      
      console.log("[ProductForm] Saving draft with attribute values:", {
        active: Object.keys(formAttributeValues),
        inactive: Object.keys(inactiveAttributeValues),
        preserved: Object.keys(preservedValues),
        total: Object.keys(allAttributeValues).length,
      });
      
      const draftData = {
        product: {
          title,
          name: title,
          product_code: (sku.trim() || product?.slug) ?? "",
          slug: formData.get("slug"),
          type_id: (formData.get("type_id") as string) || null,
          sku: sku || null,
          price_inr: parseFloat((formData.get("price_inr") as string) || "0"),
          price_aed: parseFloat((formData.get("price_aed") as string) || "0"),
          description: (formData.get("description") as string) || null,
          stock_status: formData.get("stock_status") || "in_stock",
          featured: formData.get("featured") === "on",
          new_arrival: formData.get("new_arrival") === "on",
          show_on_homepage: formData.get("show_on_homepage") === "on",
        },
        // Use draft images if available, otherwise fall back to live product images
        images: draftImages && draftImages.length > 0
          ? draftImages
          : (product?.product_images ?? []).map((img) => ({
              storage_key: img.storage_key,
              alt_text: img.alt_text ?? null,
              is_primary: img.is_primary ?? false,
              show_on_homepage: img.show_on_homepage ?? false,
              sort_order: img.sort_order,
            })),
        attribute_values: allAttributeValues,
      };
      
      console.log("[ProductForm] Saving draft:", {
        productFields: Object.keys(draftData.product),
        imageCount: draftData.images.length,
        attributeCount: Object.keys(draftData.attribute_values).length,
      });
      
      const result = await saveProductDraft(product.id, draftData);
      setLoading(false);
      onSavingChange?.(false);
      if (result.error) setError(result.error);
      else onSaveSuccess?.("Draft saved");
      return;
    }

    const result = isEdit
      ? await updateProduct(product!.id, formData)
      : await createProduct(formData);

    setLoading(false);
    onSavingChange?.(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if ("id" in result && result.id) {
      router.push(`/admin/products/${result.id}/edit`);
    } else {
      router.push("/admin/products");
      router.refresh();
    }
  }

  return (
    <form
      ref={ref}
      id={id}
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
        <input
          name="title"
          defaultValue={product?.title}
          required
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Slug</label>
        <input
          name="slug"
          defaultValue={product?.slug}
          placeholder="auto-generated from title"
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
        <select
          name="type_id"
          defaultValue={product?.type_id ?? ""}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        >
          <option value="">—</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">SKU</label>
        <input
          name="sku"
          defaultValue={product?.sku ?? ""}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Price (INR) *</label>
          <input
            name="price_inr"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price_inr ?? 0}
            required
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Price (AED) *</label>
          <input
            name="price_aed"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price_aed ?? 0}
            required
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Stock status</label>
        <select
          name="stock_status"
          defaultValue={product?.stock_status ?? "in_stock"}
          className="w-full px-3 py-2 border border-stone-300 rounded"
        >
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>
      {attributeDefinitions.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(byGroup).map(([groupName, defs]) => (
            <div key={groupName}>
              <h3 className="text-sm font-medium text-stone-800 mb-3">{groupName}</h3>
              <div className="space-y-3">
                {defs.map((def) => (
                  <div key={def.key}>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      {def.label}
                      {def.is_required && " *"}
                    </label>
                    {def.input_type === "text" && (
                      <input
                        name={`attr_${def.key}`}
                        defaultValue={attributeValues[def.key] ?? ""}
                        className="w-full px-3 py-2 border border-stone-300 rounded"
                      />
                    )}
                    {def.input_type === "textarea" && (
                      <textarea
                        name={`attr_${def.key}`}
                        defaultValue={attributeValues[def.key] ?? ""}
                        rows={3}
                        className="w-full px-3 py-2 border border-stone-300 rounded"
                      />
                    )}
                    {def.input_type === "select" && (
                      <select
                        name={`attr_${def.key}`}
                        defaultValue={attributeValues[def.key] ?? ""}
                        className="w-full px-3 py-2 border border-stone-300 rounded"
                      >
                        <option value="">—</option>
                        {parseSelectOptions(def.options_json).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Attributes (JSON)</label>
          <textarea
            name="attributes"
            defaultValue={attrsStr}
            rows={3}
            className="w-full px-3 py-2 border border-stone-300 rounded font-mono text-sm"
            placeholder='{"fabric": "Silk", "length": "6.5 m"}'
          />
        </div>
      )}
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
            className="rounded border-stone-300"
          />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="new_arrival"
            defaultChecked={product?.new_arrival ?? false}
            className="rounded border-stone-300"
          />
          <span className="text-sm">New arrival</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="show_on_homepage"
            defaultChecked={product?.show_on_homepage ?? false}
            className="rounded border-stone-300"
          />
          <span className="text-sm">Show on homepage</span>
        </label>
      </div>

      {isEdit && inactiveDefinitions.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={showInactiveAttributes}
              onChange={(e) => setShowInactiveAttributes(e.target.checked)}
              className="rounded border-stone-300"
            />
            Show inactive attributes (read-only)
          </label>
        </div>
      )}

      {isEdit && showInactiveAttributes && inactiveDefinitions.length > 0 && (
        <div className="p-3 bg-stone-50 border border-stone-200 rounded space-y-2">
          <p className="text-xs font-medium text-stone-500">Inactive attributes — legacy values only</p>
          {inactiveDefinitions.map((def) => {
            const value = attributeValues[def.key];
            if (value == null || value === "") return null;
            return (
              <div key={def.key} className="flex gap-2 items-baseline text-sm">
                <span className="text-stone-500 w-32 shrink-0">{def.label}</span>
                <span className="text-stone-700 bg-white px-2 py-1 border border-stone-200 rounded flex-1">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Images section */}
      {isEdit && product?.id ? (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Images</label>
          {draftImages ? (
            <DraftImageManager 
              productId={product.id} 
              images={draftImages}
              onImagesChange={onImagesChange}
            />
          ) : (
            <ProductImageManager productId={product.id} images={product.product_images ?? []} />
          )}
        </div>
      ) : (
        <div ref={uploaderRef}>
          <ProductImageUploader 
            onImagesChange={handleImagesChange}
            sessionId={sessionId}
            onCleanup={cleanupTempUploads}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!hideActions && (
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : isEdit ? (product?.status === "approved" ? "Save draft" : "Update") : "Create"}
          </button>
          <Link
            href="/admin/products"
            onClick={handleCancel}
            className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded hover:bg-stone-50"
          >
            Cancel
          </Link>
        </div>
      )}
    </form>
  );
});
