"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGallery } from "../components/ProductGallery";
import { ProductGrid } from "../components/ProductGrid";
import { formatAed, formatInr } from "../lib/format-price";
import { stockLabel } from "../lib/stock";
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
  relatedProducts = [],
}: {
  product: Product;
  slug: string;
  settings: { whatsappNumber: string | null; callNumber: string | null; template: string };
  specs: Record<string, string>;
  relatedProducts?: Product[];
}) {
  const showWhatsApp = Boolean(settings.whatsappNumber);
  const showCall = Boolean(settings.callNumber);
  const template = settings.template;

  const [whatsAppHref, setWhatsAppHref] = useState<string | null>(null);

  const showInr = product.price_inr > 0;
  const showAed = product.price_aed > 0;
  const stock = stockLabel(product.stock_status);

  useEffect(() => {
    if (!settings.whatsappNumber) return;
    const productUrl = `${window.location.origin}/saree/${slug}`;
    const message = [template.trim(), productUrl].filter(Boolean).join("\n\n");
    setWhatsAppHref(getWhatsAppLink(settings.whatsappNumber, message));
  }, [settings.whatsappNumber, slug, template]);

  return (
    <div className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
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

            {(showInr || showAed) && (
              <div className="space-y-1">
                {showInr && (
                  <p className="text-2xl font-medium text-foreground">{formatInr(product.price_inr)}</p>
                )}
                {showAed && (
                  <p className="text-sm text-muted">{formatAed(product.price_aed)}</p>
                )}
              </div>
            )}

            <p className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                  stock.tone === "ok"
                    ? "bg-emerald-600"
                    : stock.tone === "warn"
                      ? "bg-amber-500"
                      : "bg-stone-400"
                }`}
                aria-hidden
              />
              <span className="text-foreground">{stock.label}</span>
              {product.stock_status === "low_stock" && (
                <span className="text-muted text-[13px]">— Limited quantity available</span>
              )}
            </p>

            {product.description && (
              <div>
                <h2 className="text-sm font-medium text-foreground mb-2">
                  Description
                </h2>
                <div className="prose prose-sm text-muted max-w-none text-justify">
                  {product.description}
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              {showWhatsApp && (
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
              )}
              {showCall && (
                <a
                  href={getTelLink(settings.callNumber!)}
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-rim text-foreground rounded-sm hover:bg-surface"
                >
                  Call us
                </a>
              )}
            </div>

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
                      <dt className="text-muted text-justify">{label}</dt>
                      <dd className="text-foreground text-justify">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="pt-10 border-t border-rim space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h2 className="font-serif text-xl text-foreground">More in this collection</h2>
              <Link
                href="/kanchipuram-silks"
                className="text-sm font-medium text-accentBerry hover:underline"
              >
                View all →
              </Link>
            </div>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </div>
  );
}
