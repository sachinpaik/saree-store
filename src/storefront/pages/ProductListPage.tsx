import { ProductGrid } from "../components/ProductGrid";
import type { Product } from "../types/storefront.types";

export function ProductListPage({ products }: { products: Product[] }) {
  return (
    <div className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="font-serif text-2xl text-stone-900 mb-6">Kanchipuram Silks</h1>
        <p className="text-stone-600 text-sm mb-8">Browse our collection of Kanchipuram and silk sarees.</p>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
