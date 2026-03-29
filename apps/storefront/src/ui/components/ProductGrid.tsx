import { ProductCard } from "./ProductCard";
import type { Product } from "../../domain/types/storefront.types";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-stone-500 text-sm py-10">No products at the moment.</p>
    );
  }
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 list-none p-0 m-0">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} eager={index < 4} />
        </li>
      ))}
    </ul>
  );
}
