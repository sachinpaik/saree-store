"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../domain/types/storefront.types";

type SortMode = "featured" | "newest";

function sortProducts(products: Product[], mode: SortMode): Product[] {
  const list = [...products];
  if (mode === "featured") {
    return list.sort((a, b) => {
      const featuredDiff = Number(b.featured ?? false) - Number(a.featured ?? false);
      if (featuredDiff !== 0) return featuredDiff;
      return a.title.localeCompare(b.title);
    });
  }
  return list;
}

export function ProductListClient({
  products,
  whatsappHref,
}: {
  products: Product[];
  whatsappHref: string | null;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const sortedProducts = useMemo(() => sortProducts(products, sortMode), [products, sortMode]);

  return (
    <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-[#1a1008]/10 px-0 pb-8 lg:border-b-0 lg:border-r lg:pr-8">
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#c9962a]">Collection notes</p>
            <div className="space-y-3">
              <div className="border-b border-[#1a1008]/10 pb-3">
                <p className="text-sm text-[#1a1008]">All sarees</p>
                <p className="mt-1 text-[11px] text-[#1a1008]/45">{products.length} curated pieces</p>
              </div>
              <div className="border-b border-[#1a1008]/10 pb-3">
                <p className="text-sm text-[#1a1008]">Featured picks</p>
                <p className="mt-1 text-[11px] text-[#1a1008]/45">
                  {products.filter((product) => product.featured).length} marked by the team
                </p>
              </div>
              <div className="pb-1">
                <p className="text-sm text-[#1a1008]">Direct enquiry support</p>
                <p className="mt-1 text-[11px] text-[#1a1008]/45">
                  Extra photos, videos, pricing, and availability over WhatsApp
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[4px] border-l-2 border-[#c9962a] bg-[#f7f3ee] p-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-[#7a5c2e]">Need help choosing?</p>
            <p className="text-sm leading-6 text-[#1a1008]/55">
              We can guide you to the right saree for gifting, personal wear, or boutique buying.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-[3px] bg-[#25d366] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white"
              >
                Chat with us
              </a>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="pt-8 lg:pl-10 lg:pt-0">
        <div className="mb-6 flex flex-col gap-3 border-b border-[#1a1008]/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#1a1008]/55">Sort by</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="rounded-[3px] border border-[#1a1008]/15 bg-white px-3 py-2 text-[12px] text-[#1a1008] outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <p className="text-[12px] text-[#1a1008]/48">
            Curated for retail buyers, gifting, and boutique enquiries.
          </p>
        </div>

        {sortedProducts.length === 0 ? (
          <p className="py-10 text-sm text-[#1a1008]/50">No products at the moment.</p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProducts.map((product, index) => (
              <li key={product.id}>
                <ProductCard product={product} eager={index < 3} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 grid gap-4 border-t border-[#1a1008]/10 pt-6 md:grid-cols-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0ebe3] text-[#7a5c2e]">
              <span className="text-sm">1</span>
            </div>
            <p className="text-sm leading-6 text-[#1a1008]/52">
              <strong className="block font-medium text-[#1a1008]">Curated selection</strong>
              Product choices are kept focused instead of overwhelming the buyer.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0ebe3] text-[#7a5c2e]">
              <span className="text-sm">2</span>
            </div>
            <p className="text-sm leading-6 text-[#1a1008]/52">
              <strong className="block font-medium text-[#1a1008]">Direct support</strong>
              Ask for close-ups, drape videos, and price clarity before you decide.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0ebe3] text-[#7a5c2e]">
              <span className="text-sm">3</span>
            </div>
            <p className="text-sm leading-6 text-[#1a1008]/52">
              <strong className="block font-medium text-[#1a1008]">UAE and India ready</strong>
              The collection is presented for quick enquiry and smooth customer communication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
