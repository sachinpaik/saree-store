"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMediaUrl } from "@/lib/media-url";

type ProductRow = {
  id: string;
  title: string;
  sku: string | null;
  price_inr: number;
  types: { name?: string } | { name?: string }[] | null;
  product_images?: {
    storage_key: string;
    image_url?: string | null;
    thumb_url?: string | null;
    sort_order: number;
  }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select(
        `
      id, slug, title, sku, price_inr,
      product_images(storage_key, image_url, thumb_url, sort_order),
      types(name)
    `
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts((data as ProductRow[]) ?? []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Products</h1>
        <Link
          href="/products/new"
          className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800"
        >
          Add product
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-right px-4 py-3 font-medium">Price (INR)</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => {
              const img = p.product_images
                ?.sort((a, b) => a.sort_order - b.sort_order)
                .at(0);
              return (
                <tr key={p.id} className="border-b border-stone-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 bg-stone-100 rounded overflow-hidden shrink-0">
                        {(img?.thumb_url || img?.storage_key || img?.image_url) ? (
                          <Image
                            src={getMediaUrl(img.thumb_url || img.storage_key || img.image_url || "")}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div>
                        <span className="font-medium text-stone-900">{p.title}</span>
                        {p.sku && <span className="block text-stone-500 text-xs">{p.sku}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {Array.isArray(p.types)
                      ? p.types[0]?.name
                      : (p.types as { name?: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-700 text-right whitespace-nowrap font-medium">
                    ₹{Number(p.price_inr).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/products/edit?id=${encodeURIComponent(p.id)}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded border border-stone-300 text-stone-700 hover:bg-stone-50"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {products && products.length === 0 && (
          <p className="p-8 text-center text-stone-500">No products yet.</p>
        )}
      </div>
    </div>
  );
}
