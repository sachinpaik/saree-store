"use client";

import { useState, useEffect } from "react";
import { SignatureCarousel } from "@/components/sections/SignatureCarousel";
import { BrandStory } from "@/components/sections/BrandStory";
import { CuratedPreviewGrid } from "@/components/sections/CuratedPreviewGrid";
import { PreviewBar } from "@/components/admin/PreviewBar";
import { getPreviewModeStatus } from "@/app/actions/preview-mode";
import { loadProductsForPreview } from "@/lib/preview-data";
import { getMediaUrl } from "@/lib/media-url";
import type { Saree } from "@/lib/types";

const PREVIEW_LIMIT = 8;
const CAROUSEL_LIMIT = 20;

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

function productToHomepageSaree(p: ProductShape): Saree {
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
  const showOnHome = images.find((img) => img.show_on_homepage);
  const primary = images.find((img) => img.is_primary);
  const homepageImage = showOnHome || primary || images[0];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    sku: p.sku ?? null,
    images: homepageImage ? [homepageImage] : [],
    price_inr: p.price_inr ?? 0,
    price_aed: p.price_aed ?? 0,
    description: p.description ?? null,
    stock_status: p.stock_status ?? "in_stock",
    show_on_homepage: p.show_on_homepage ?? false,
    attributes: p.attributes ?? undefined,
  };
}

function pickHomepageImageUrl(saree: Saree): string | null {
  const img = saree.images[0];
  return img?.storage_key ? getMediaUrl(img.storage_key) : null;
}

export function StorefrontHomePage({
  initialSarees,
  initialCarouselUrls,
  rotationSeconds,
}: {
  initialSarees: Saree[];
  initialCarouselUrls: string[];
  rotationSeconds?: number;
}) {
  const [sarees, setSarees] = useState<Saree[]>(initialSarees);
  const [carouselUrls, setCarouselUrls] = useState<string[]>(initialCarouselUrls);
  const [previewStatus, setPreviewStatus] = useState<{
    isAdmin: boolean;
    previewEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    getPreviewModeStatus().then((status) => {
      setPreviewStatus(status);
      if (status.previewEnabled) {
        loadProductsForPreview({ limit: PREVIEW_LIMIT, featured: false }).then((result) => {
          const homepageProducts = (result.products ?? [])
            .filter((p: ProductShape) => p.show_on_homepage)
            .slice(0, PREVIEW_LIMIT);
          const mapped = homepageProducts.map((p: ProductShape) => productToHomepageSaree(p));
          setSarees(mapped);
          const urls: string[] = [];
          for (const s of mapped) {
            const url = pickHomepageImageUrl(s);
            if (url && urls.length < CAROUSEL_LIMIT) urls.push(url);
          }
          setCarouselUrls(urls);
        });
      }
    });
  }, []);

  return (
    <>
      {previewStatus?.isAdmin && (
        <PreviewBar
          currentPath="/"
          initialMode={previewStatus.previewEnabled ? "preview" : "live"}
        />
      )}
      <div className={previewStatus?.isAdmin ? "mt-12" : ""}>
        <SignatureCarousel
          imageUrls={carouselUrls}
          rotationSeconds={rotationSeconds ?? undefined}
        />
        <BrandStory />
        <CuratedPreviewGrid sarees={sarees} />
      </div>
    </>
  );
}
