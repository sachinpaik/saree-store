"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductEditBanners } from "./ProductEditBanners";
import { ProductEditStickyFooter } from "./ProductEditStickyFooter";
import { ProductForm } from "./ProductForm";
import type { AttributeDefinition } from "@/lib/data/attribute-definitions-shared";

type Type = { id: string; name: string; slug: string };
type Image = {
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

type Props = {
  productId: string;
  productCode: string;
  productStatus: string;
  isDiscontinued: boolean;
  rejectionReason: string | null;
  product: Product;
  types: Type[];
  attributeDefinitions: AttributeDefinition[];
  attributeValues: Record<string, string>;
  inactiveDefinitions: AttributeDefinition[];
};

const SCROLL_RESTORE_KEY = "product-edit-scroll-y";

export function EditProductClientLayout({
  productId,
  productCode,
  productStatus,
  isDiscontinued,
  rejectionReason,
  product,
  types,
  attributeDefinitions,
  attributeValues,
  inactiveDefinitions,
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

  const handleSave = useCallback(() => {
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

  const imageCount = (product.product_images ?? []).filter((i) => i.storage_key).length;

  return (
    <div className="pb-28">
      <div className="mb-4">
        <Link
          href="/products"
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

      <ProductEditBanners
        productStatus={productStatus}
        isDiscontinued={isDiscontinued}
        rejectionReason={rejectionReason}
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
      />
      <ProductEditStickyFooter
        productId={productId}
        productCode={productCode}
        productStatus={productStatus}
        imageCount={imageCount}
        isDiscontinued={isDiscontinued}
        saving={saving}
        lastSavedAt={lastSavedAt}
        toastMessage={toastMessage}
        onClearToast={clearToast}
        onSave={handleSave}
      />
    </div>
  );
}
