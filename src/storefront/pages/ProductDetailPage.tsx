"use client";

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
  const showCall = Boolean(settings.callNumber);
  const template = settings.template
    .replace(/\{title\}/g, product.title)
    .replace(/\{sku\}/g, product.sku ?? "");

  return (
    <div className="py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/kanchipuram-silks" className="text-sm text-stone-600 hover:text-stone-900 mb-6 inline-block">
          ← Back to Kanchipuram Silks
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ProductGallery images={product.images} title={product.title} />
          <div className="space-y-6">
            <h1 className="font-serif text-2xl md:text-3xl text-stone-900">{product.title}</h1>
            {product.sku && (
              <p className="text-stone-600 text-sm">
                <span className="font-medium text-stone-800">{product.sku}</span> · Product code
              </p>
            )}
            <p className="text-stone-800 text-lg">
              ₹{product.price_inr.toLocaleString("en-IN")}
              {product.price_aed > 0 && ` · AED ${product.price_aed}`}
            </p>
            <p className="text-sm text-stone-600">
              Stock:{" "}
              <span
                className={
                  product.stock_status === "in_stock"
                    ? "text-green-700"
                    : product.stock_status === "low_stock"
                      ? "text-amber-700"
                      : "text-red-700"
                }
              >
                {product.stock_status === "in_stock" ? "In stock" : product.stock_status === "low_stock" ? "Low stock" : "Out of stock"}
              </span>
            </p>
            {product.description && (
              <div>
                <h2 className="text-sm font-medium text-stone-700 mb-2">Description</h2>
                <div className="prose prose-sm text-stone-600 max-w-none">{product.description}</div>
              </div>
            )}
            {Object.keys(specs).length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-stone-700 mb-2">Specifications</h2>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(specs).map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="text-stone-500">{label}</dt>
                      <dd className="text-stone-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {(showWhatsApp || showCall) && (
              <div className="flex flex-wrap gap-3 pt-2">
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
      </div>
    </div>
  );
}
