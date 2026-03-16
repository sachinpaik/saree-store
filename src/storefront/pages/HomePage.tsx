"use client";

import { Carousel } from "../components/Carousel";
import { ProductGrid } from "../components/ProductGrid";
import type { Product } from "../types/storefront.types";

export function HomePage({
  featuredProducts,
  carouselImageUrls,
  rotationSeconds = 5,
}: {
  featuredProducts: Product[];
  carouselImageUrls: string[];
  rotationSeconds?: number;
}) {
  return (
    <>
      <Carousel imageUrls={carouselImageUrls} rotationSeconds={rotationSeconds} />
      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-serif text-xl text-stone-900 mb-6">Featured</h2>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>
    </>
  );
}
