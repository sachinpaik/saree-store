import Link from "next/link";
import { ProductListClient } from "../components/ProductListClient";
import type { Product } from "../types/storefront.types";

export function ProductListPage({ products }: { products: Product[] }) {
  const count = products.length;

  return (
    <div className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
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
            <li className="text-foreground">Kanchipuram Silks</li>
          </ol>
        </nav>

        {/* Heading + count + short description */}
        <header className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-foreground">Kanchipuram Silks</h1>
            <p className="text-muted text-sm mt-1 max-w-xl">
              Pure and blended Kanchipuram sarees, curated for boutiques, resellers and individual buyers.
            </p>
          </div>
          {count > 0 && (
            <p className="text-sm text-muted">
              <span className="font-medium text-foreground">{count}</span> saree{count === 1 ? "" : "s"} in this collection
            </p>
          )}
        </header>

        <ProductListClient products={products} />
      </div>
    </div>
  );
}
