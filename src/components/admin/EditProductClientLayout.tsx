"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductEditBanners } from "./ProductEditBanners";
import { ProductEditStickyFooter } from "./ProductEditStickyFooter";
import { ProductForm } from "./ProductForm";
import { OpenPreviewButton } from "./OpenPreviewButton";
import type { AttributeDefinition } from "@/lib/data/attribute-definitions-shared";

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

type DraftStatus = "draft" | "pending" | "approved" | "rejected" | null;

function toDraftStatus(s: string | null): DraftStatus {
  if (s === "draft" || s === "pending" || s === "approved" || s === "rejected") return s;
  return null;
}

type Props = {
  productId: string;
  productCode: string;
  productStatus: string;
  draftStatus: string | null;
  isDiscontinued: boolean;
  rejectionReason: string | null;
  draftRejectionReason: string | null;
  product: Product;
  types: Type[];
  attributeDefinitions: AttributeDefinition[];
  attributeValues: Record<string, string>;
  inactiveDefinitions: AttributeDefinition[];
  draftImages: DraftImage[];
  draftExists: boolean;
};

const SCROLL_RESTORE_KEY = "product-edit-scroll-y";

export function EditProductClientLayout({
  productId,
  productCode,
  productStatus,
  draftStatus,
  isDiscontinued,
  rejectionReason,
  draftRejectionReason,
  product,
  types,
  attributeDefinitions,
  attributeValues,
  inactiveDefinitions,
  draftImages,
  draftExists,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const clearToast = useCallback(() => setToastMessage(null), []);

  useEffect(() => {
    const y = sessionStorage.getItem(SCROLL_RESTORE_KEY);
    if (y !== null) {
      sessionStorage.removeItem(SCROLL_RESTORE_KEY);
      window.scrollTo(0, Number(y));
    }
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const handleSavingChange = useCallback((value: boolean) => {
    setSaving(value);
  }, []);

  const handleSaveSuccess = useCallback(
    (message: string) => {
      setLastSavedAt(new Date());
      setToastMessage(message);
      setDirty(false);
      sessionStorage.setItem(SCROLL_RESTORE_KEY, String(window.scrollY));
      router.refresh();
    },
    [router]
  );

  const handleSaveDraft = useCallback(() => {
    const form = document.getElementById("product-form") as HTMLFormElement | null;
    if (form) form.requestSubmit();
  }, []);

  const handleFormRef = useCallback((el: HTMLFormElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!el) return;
    const onInput = () => setDirty(true);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
    cleanupRef.current = () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onInput);
    };
  }, []);

  const handleImagesChange = useCallback(() => {
    setDirty(true);
  }, []);

  // Use draft images for count if available
  const imageCount = draftImages.filter(i => !i.marked_for_deletion).length;
  const canSubmitForApproval = imageCount >= 1;

  return (
    <div className="pb-28">
      <div className="mb-4">
        <Link
          href="/admin/products"
          className="text-sm text-stone-600 hover:text-stone-900"
          onClick={(e) => {
            if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
              e.preventDefault();
            }
          }}
        >
          ← Back to products
        </Link>
      </div>
      
      {draftExists && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-blue-900">
            ⚠️ You are editing a draft. Customers still see the last approved version.
          </p>
          <OpenPreviewButton productId={productId} productSlug={product.slug} />
        </div>
      )}
      
      <ProductEditBanners
        productStatus={productStatus}
        draftStatus={draftStatus}
        isDiscontinued={isDiscontinued}
        rejectionReason={rejectionReason}
        draftRejectionReason={draftRejectionReason}
      />
      <ProductForm
        ref={handleFormRef}
        id="product-form"
        types={types}
        product={product}
        attributeDefinitions={attributeDefinitions}
        attributeValues={attributeValues}
        inactiveDefinitions={inactiveDefinitions}
        hideActions
        onSavingChange={handleSavingChange}
        onSaveSuccess={handleSaveSuccess}
        draftImages={draftImages}
        onImagesChange={handleImagesChange}
      />
      <ProductEditStickyFooter
        productId={productId}
        productCode={productCode}
        productStatus={productStatus as "draft" | "pending" | "approved" | "rejected"}
        imageCount={imageCount}
        isDiscontinued={isDiscontinued}
        draftStatus={toDraftStatus(draftStatus)}
        canSubmitForApproval={canSubmitForApproval}
        saving={saving}
        lastSavedAt={lastSavedAt}
        toastMessage={toastMessage}
        onClearToast={clearToast}
        onSaveDraft={handleSaveDraft}
        onShowToast={setToastMessage}
      />
    </div>
  );
}
