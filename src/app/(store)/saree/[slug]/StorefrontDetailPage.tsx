"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PreviewBar } from "@/components/admin/PreviewBar";
import { SareeGallery } from "@/components/saree/SareeGallery";
import { PriceLine } from "@/components/saree/PriceLine";
import { ProductSpecifications } from "@/components/saree/ProductSpecifications";
import { Container } from "@/components/layout/Container";
import { getWhatsAppLink, getTelLink } from "@/lib/utils";
import { getPreviewModeStatus } from "@/app/actions/preview-mode";
import { loadProductForPreview } from "@/lib/preview-data";
import { getProductSpecsForDisplayAction } from "@/app/actions/specs";
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

type Settings = {
  whatsappNumber: string | null;
  callNumber: string | null;
  template: string;
};

export function StorefrontDetailPage({
  initialSaree,
  slug,
  settings,
  initialSpecs,
}: {
  initialSaree: Saree;
  slug: string;
  settings: Settings;
  initialSpecs: Record<string, string>;
}) {
  const [saree, setSaree] = useState<Saree>(initialSaree);
  const [specs, setSpecs] = useState<Record<string, string>>(initialSpecs);
  const [previewStatus, setPreviewStatus] = useState<{
    isAdmin: boolean;
    previewEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    getPreviewModeStatus().then((status) => {
      setPreviewStatus(status);
      if (status.previewEnabled) {
        loadProductForPreview(initialSaree.id).then((result) => {
          if (result.product) {
            const mapped = productToSaree(result.product as ProductShape);
            setSaree(mapped);
            getProductSpecsForDisplayAction(mapped.id, mapped.attributes).then(setSpecs);
          }
        });
      }
    });
  }, [initialSaree.id]);

  const showWhatsApp = Boolean(settings.whatsappNumber);
  const showCall = Boolean(settings.callNumber);
  const template = settings.template
    .replace(/\{title\}/g, saree.title)
    .replace(/\{sku\}/g, saree.sku ?? "");

  return (
    <>
      {previewStatus?.isAdmin && (
        <PreviewBar
          currentPath={`/saree/${slug}`}
          productId={saree.id}
          initialMode={previewStatus.previewEnabled ? "preview" : "live"}
        />
      )}
      <div className={`py-10 md:py-14 ${previewStatus?.isAdmin ? "mt-12" : ""}`}>
        <Container>
          <div className="mb-6">
            <Link
              href="/kanchipuram-silks"
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              ← Back to Kanchipuram Silks
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-5xl">
            <SareeGallery images={saree.images} title={saree.title} />
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-stone-900 tracking-wide mb-1">
                  {saree.title}
                </h1>
                <p className="text-sm text-stone-500">Saree Name</p>
              </div>
              {saree.sku && (
                <div>
                  <p className="text-stone-800 font-medium">{saree.sku}</p>
                  <p className="text-xs text-stone-500">Product Code</p>
                </div>
              )}
              <div className="mb-2">
                <PriceLine saree={saree} />
              </div>
              <p className="text-sm text-stone-600">
                Stock:{" "}
                <span
                  className={
                    saree.stock_status === "in_stock"
                      ? "text-green-700"
                      : saree.stock_status === "low_stock"
                        ? "text-amber-700"
                        : "text-red-700"
                  }
                >
                  {saree.stock_status === "in_stock"
                    ? "In stock"
                    : saree.stock_status === "low_stock"
                      ? "Low stock"
                      : "Out of stock"}
                </span>
              </p>
              {saree.description && (
                <div>
                  <h2 className="text-sm font-medium text-stone-700 mb-2">Description</h2>
                  <div className="prose prose-sm prose-stone max-w-none text-stone-600">
                    {saree.description}
                  </div>
                </div>
              )}
              {specs && Object.keys(specs).length > 0 && (
                <ProductSpecifications specs={specs} />
              )}
              {(showWhatsApp || showCall) && (
                <div className="flex flex-wrap gap-3">
                  {showWhatsApp && (
                    <a
                      href={getWhatsAppLink(settings.whatsappNumber!, template)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-sm hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  )}
                  {showCall && (
                    <a
                      href={getTelLink(settings.callNumber!)}
                      className="inline-flex items-center px-4 py-2.5 text-sm font-medium border border-stone-300 text-stone-800 rounded-sm hover:bg-stone-50"
                    >
                      Call
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
