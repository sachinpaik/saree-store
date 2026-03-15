"use client";

import { useState, useEffect } from "react";
import { PreviewBar } from "@/components/admin/PreviewBar";
import { KanchipuramSilksClient } from "./KanchipuramSilksClient";
import { getPreviewModeStatus } from "@/app/actions/preview-mode";
import { loadProductsForPreview } from "@/lib/preview-data";
import type { Saree } from "@/lib/types";

type ProductShape = {
  id: string;
  slug: string;
  title: string;
  sku?: string | null;
  price_inr?: number;
  price_aed?: number;
  description?: string | null;
  stock_status?: string;
  show_on_homepage?: boolean;
  attributes?: Record<string, string | number | boolean>;
  product_images?: {
    id: string;
    storage_key: string;
    sort_order: number;
    alt_text?: string | null;
    is_primary?: boolean;
    show_on_homepage?: boolean;
  }[];
};

function productToSaree(p: ProductShape): Saree {
  const images = (p.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      storage_key: img.storage_key,
      sort_order: img.sort_order,
      alt_text: img.alt_text ?? null,
      is_primary: img.is_primary ?? false,
      show_on_homepage: img.show_on_homepage ?? false,
    }));
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    sku: p.sku ?? null,
    images,
    price_inr: p.price_inr ?? 0,
    price_aed: p.price_aed ?? 0,
    description: p.description ?? null,
    stock_status: p.stock_status ?? "in_stock",
    show_on_homepage: p.show_on_homepage ?? false,
    attributes: p.attributes ?? undefined,
  };
}

export function StorefrontListingPage({ initialSarees }: { initialSarees: Saree[] }) {
  const [sarees, setSarees] = useState<Saree[]>(initialSarees);
  const [previewStatus, setPreviewStatus] = useState<{
    isAdmin: boolean;
    previewEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    getPreviewModeStatus().then((status) => {
      setPreviewStatus(status);
      if (status.previewEnabled) {
        loadProductsForPreview({}).then((result) => {
          const mapped = (result.products ?? []).map((p: ProductShape) => productToSaree(p));
          setSarees(mapped);
        });
      }
    });
  }, []);

  return (
    <>
      {previewStatus?.isAdmin && (
        <PreviewBar
          currentPath="/kanchipuram-silks"
          initialMode={previewStatus.previewEnabled ? "preview" : "live"}
        />
      )}
      <KanchipuramSilksClient
        initialSarees={sarees}
        previewMode={previewStatus?.isAdmin}
      />
    </>
  );
}
