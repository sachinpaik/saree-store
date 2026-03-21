"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGallery } from "../components/ProductGallery";
import type { Product } from "../types/storefront.types";

function getWhatsAppLink(phone: string, text: string): string {
  const n = phone.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
function getTelLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function ProductDetailPage({
  product,
  slug,
  settings,
  specs,
}: {
  product: Product;
  slug: string;
  settings: { whatsappNumber: string | null; callNumber: string | null; template: string };
  specs: Record<string, string>;
}) {
  const showWhatsApp = Boolean(settings.whatsappNumber);
  const template = settings.template
    .replace(/\{title\}/g, product.title)
    .replace(/\{sku\}/g, product.sku ?? "");

  const [whatsAppHref, setWhatsAppHref] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.whatsappNumber) return;
    const productPath = `/saree/${slug}`;
    const origin = window.location.origin;
    const productUrl = `${origin}${productPath}`;
    const message = productUrl || "";
    setWhatsAppHref(getWhatsAppLink(settings.whatsappNumber, message));
  }, [settings.whatsappNumber, slug]);

  return (
    <div className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted">
              /
            </li>
            <li>
              <Link href="/kanchipuram-silks" className="hover:underline">
                Kanchipuram Silks
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted">
              /
            </li>
            <li className="text-foreground line-clamp-1 max-w-xs md:max-w-sm">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ProductGallery images={product.images} title={product.title} />
          <div className="space-y-5">
            {/* Title + SKU */}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl md:text-3xl text-foreground">
                {product.title}
              </h1>
              {product.sku && (
                <p className="text-[13px] text-muted">
                  SKU:{" "}
                  <span className="tracking-wide text-foreground">
                    {product.sku}
                  </span>
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-sm font-medium text-foreground mb-2">
                  Description
                </h2>
                <div className="prose prose-sm text-muted max-w-none">
                  {product.description}
                </div>
              </div>
            )}

            {/* Specifications */}
            {Object.keys(specs).length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-foreground mb-2">
                  Specifications
                </h2>
                <dl className="border border-rim/70 rounded-sm divide-y divide-rim/60 text-sm bg-surface/60">
                  {Object.entries(specs).map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[1fr,1.5fr] gap-3 px-3 py-2"
                    >
                      <dt className="text-muted">{label}</dt>
                      <dd className="text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* CTAs */}
            {showWhatsApp && (
              <div className="pt-2">
                <a
                  href={whatsAppHref ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-sm hover:bg-green-700"
                >
                  <span>WhatsApp</span>
                  <span className="hidden sm:inline">
                    – Enquire about this saree
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
