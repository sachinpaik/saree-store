"use client";

import { ProductGrid } from "./ProductGrid";
import type { Product } from "../types/storefront.types";

export function ProductListClient({ products }: { products: Product[] }) {
  return <ProductGrid products={products} />;
}
