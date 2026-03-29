"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductGallery } from "../components/ProductGallery";
import { ProductGrid } from "../components/ProductGrid";
import { formatAed, formatInr } from "../../domain/utils/format-price";
import { stockLabel } from "../../domain/utils/stock";
import type { Product } from "../../domain/types/storefront.types";

type CurrencyMode = "AED" | "INR";

function getWhatsAppLink(phone: string, text: string): string {
  const n = phone.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function getTelLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function getProductType(product: Product): string {
  const attrs = product.attributes ?? {};
  const pieces = [
    typeof attrs.fabric === "string" ? attrs.fabric : null,
    typeof attrs.collection_type === "string" ? attrs.collection_type : null,
    typeof attrs.pattern === "string" ? attrs.pattern : null,
  ].filter(Boolean);

  if (pieces.length > 0) return pieces.join(" · ");
  return "Kanchipuram silk";
}

function getDisplayPrice(product: Product, mode: CurrencyMode): string | null {
  if (mode === "AED") {
    return product.price_aed > 0 ? formatAed(product.price_aed) : null;
  }
  return product.price_inr > 0 ? formatInr(product.price_inr) : null;
}

function buildSpecCards(specs: Record<string, string>) {
  return Object.entries(specs).map(([label, value]) => ({ label, value }));
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
  const [whatsAppHref, setWhatsAppHref] = useState<string | null>(null);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(
    product.price_aed > 0 ? "AED" : "INR"
  );

  const stock = stockLabel(product.stock_status);
  const specCards = useMemo(() => buildSpecCards(specs), [specs]);
  const productType = getProductType(product);
  const currentPrice = getDisplayPrice(product, currencyMode);
  const altInr = product.price_inr > 0 ? formatInr(product.price_inr) : null;
  const altAed = product.price_aed > 0 ? formatAed(product.price_aed) : null;

  useEffect(() => {
    if (!settings.whatsappNumber) return;
    const productUrl = `${window.location.origin}/saree/${slug}`;
    const message = [settings.template.trim(), productUrl].filter(Boolean).join("\n\n");
    setWhatsAppHref(getWhatsAppLink(settings.whatsappNumber, message));
  }, [settings.template, settings.whatsappNumber, slug]);

  return (
    <div className="bg-[#faf7f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <nav
          className="border-b border-[#1a1008]/10 pb-4 text-[11px] tracking-[0.04em] text-[#1a1008]/40"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#1a1008]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/kanchipuram-silks" className="hover:text-[#1a1008]">
                Kanchipuram Silks
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="line-clamp-1 max-w-xs text-[#c9962a] md:max-w-md">{product.title}</li>
          </ol>
        </nav>

        <section className="grid bg-white lg:grid-cols-2">
          <div className="border-b border-[#1a1008]/10 p-5 lg:border-b-0 lg:border-r lg:p-10">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          <div className="flex flex-col p-6 md:p-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[10px] tracking-[0.1em] text-[#1a1008]/35">
                {product.sku ? product.sku : "Curated silk selection"}
              </p>
              <div className="flex gap-2">
                <span className="rounded-[2px] bg-[#f5edd8] px-2 py-1 text-[10px] tracking-[0.04em] text-[#7a5c2e]">
                  UAE
                </span>
                <span className="rounded-[2px] bg-[#f5edd8] px-2 py-1 text-[10px] tracking-[0.04em] text-[#7a5c2e]">
                  India
                </span>
              </div>
            </div>

            <h1 className="font-serif text-[2.3rem] leading-[1.02] text-[#1a1008] md:text-[3.1rem]">
              {product.title}
            </h1>
            <p className="mb-6 mt-2 text-[12px] uppercase tracking-[0.08em] text-[#1a1008]/42">
              {productType}
            </p>

            <div className="mb-6 border-y border-[#1a1008]/10 py-5">
              <div className="mb-4 inline-flex overflow-hidden rounded-[3px] border border-[#1a1008]/12">
                {(["AED", "INR"] as CurrencyMode[]).map((mode) => {
                  const hasPrice = mode === "AED" ? product.price_aed > 0 : product.price_inr > 0;
                  if (!hasPrice) return null;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCurrencyMode(mode)}
                      className={`px-4 py-2 text-[11px] tracking-[0.05em] ${
                        currencyMode === mode
                          ? "bg-[#1a1008] text-[#faf7f2]"
                          : "bg-white text-[#1a1008]/50"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>

              <p className="font-serif text-[2.8rem] leading-none text-[#1a1008] md:text-[3.4rem]">
                {currentPrice ?? "Contact for price"}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-[#1a1008]/42">
                {altAed && currencyMode !== "AED" ? (
                  <p>
                    AED <span className="font-medium text-[#1a1008]/65">{altAed}</span>
                  </p>
                ) : null}
                {altInr && currencyMode !== "INR" ? (
                  <p>
                    INR <span className="font-medium text-[#1a1008]/65">{altInr}</span>
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-[#1a1008]/55">
                <span
                  className={`h-2 w-2 rounded-full ${
                    stock.tone === "ok"
                      ? "bg-[#25d366]"
                      : stock.tone === "warn"
                        ? "bg-[#d29a1c]"
                        : "bg-[#7b7066]"
                  }`}
                  aria-hidden
                />
                <span>
                  {stock.label}
                  {product.stock_status === "in_stock"
                    ? " · Ships to UAE and India with direct support"
                    : product.stock_status === "low_stock"
                      ? " · Limited quantity available"
                      : ""}
                </span>
              </div>
            </div>

            {product.description ? (
              <p className="mb-6 border-b border-[#1a1008]/10 pb-6 text-sm leading-7 text-[#1a1008]/52">
                {product.description}
              </p>
            ) : null}

            <div className="mb-7">
              <p className="mb-3 text-[10px] uppercase tracking-[0.12em] text-[#1a1008]/4">
                Available options
              </p>
              <div className="flex items-center gap-2">
                {["#8b1a1a", "#5ba3d9", "#e67e22", "#2c7a4b", "#3d1460", "#c9962a"].map(
                  (color, index) => (
                    <span
                      key={color}
                      className={`h-7 w-7 rounded-full border-2 ${
                        index === 0 ? "border-[#c9962a]" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                  )
                )}
              </div>
              <p className="mt-2 text-[12px] text-[#1a1008]/45">
                Ask via WhatsApp for available colourways and fresh photos.
              </p>
            </div>

            <div className="mb-7 flex flex-col gap-3">
              {showWhatsApp ? (
                <a
                  href={whatsAppHref ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-[2px] bg-[#25d366] px-6 py-4 text-[13px] font-medium tracking-[0.05em] text-white"
                >
                  WhatsApp - enquire about this saree
                </a>
              ) : null}
              {showCall ? (
                <a
                  href={getTelLink(settings.callNumber!)}
                  className="inline-flex items-center justify-center rounded-[2px] border border-[#1a1008]/12 px-6 py-3.5 text-[13px] text-[#1a1008]"
                >
                  Call us
                </a>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[#1a1008]/10 pt-5 text-[11px] text-[#1a1008]/45">
              <span>GI style assurance</span>
              <span>Direct from weavers</span>
              <span>UAE and India delivery</span>
              <span>Photos on request</span>
            </div>
          </div>
        </section>

        {specCards.length > 0 ? (
          <section className="border-t border-[#1a1008]/10 bg-[#faf7f2] px-0 py-12 md:py-14">
            <div className="mb-8">
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#c9962a]">
                Product details
              </p>
              <h2 className="font-serif text-[2rem] text-[#1a1008] md:text-[2.4rem]">
                Specifications
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {specCards.map((spec) => (
                <div
                  key={spec.label}
                  className="relative rounded-[3px] border border-[#1a1008]/10 bg-white p-5"
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-[#c9962a]" />
                  <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#1a1008]/38">
                    {spec.label}
                  </p>
                  <p className="text-[15px] font-medium leading-6 text-[#1a1008]">{spec.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {relatedProducts.length > 0 ? (
          <section className="border-t border-[#1a1008]/10 bg-white px-0 py-12 md:py-14">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#c9962a]">
                  You may also like
                </p>
                <h2 className="font-serif text-[2rem] text-[#1a1008] md:text-[2.4rem]">
                  More from the collection
                </h2>
              </div>
              <Link
                href="/kanchipuram-silks"
                className="text-sm font-medium text-[#7a5c2e] hover:underline"
              >
                View all
              </Link>
            </div>
            <ProductGrid products={relatedProducts} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
