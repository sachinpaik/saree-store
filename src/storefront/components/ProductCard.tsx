import Link from "next/link";
import Image from "next/image";
import {
  getCardImageUrl,
  getPrimaryProductImage,
  getProductImageAlt,
} from "../../lib/product-image";
import { formatAed, formatInr } from "../lib/format-price";
import type { Product } from "../types/storefront.types";

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const primary = getPrimaryProductImage({ images: product.images });
  const imageUrl = primary ? getCardImageUrl(primary) : undefined;

  const hasSku = Boolean(product.sku && product.sku.trim().length > 0);
  const showInr = product.price_inr > 0;
  const showAed = product.price_aed > 0;
  const isOut = product.stock_status === "out_of_stock";
  const isLow = product.stock_status === "low_stock";

  return (
    <Link href={`/saree/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-surface rounded-sm overflow-hidden mb-3 border border-rim/60">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={getProductImageAlt(primary, product.title)}
            fill
            className={`object-cover transition duration-300 group-hover:scale-[1.02] ${isOut ? "opacity-50 grayscale-[0.35]" : ""}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
            No image
          </div>
        )}
        {isLow && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 rounded-sm border border-amber-200/80">
            Low stock
          </span>
        )}
        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/35 pointer-events-none">
            <span className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900/80 rounded-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>
      {hasSku && (
        <p className="text-[11px] text-muted mt-1">
          SKU: <span className="tracking-wide">{product.sku}</span>
        </p>
      )}
      <h3
        className={`mt-0.5 font-medium text-sm line-clamp-2 group-hover:underline ${
          isOut ? "text-muted" : "text-foreground"
        }`}
      >
        {product.title}
      </h3>
      {(showInr || showAed) && (
        <div className="mt-1.5 space-y-0.5">
          {showInr && (
            <p className="text-sm font-medium text-foreground">{formatInr(product.price_inr)}</p>
          )}
          {showAed && (
            <p className="text-[12px] text-muted">{formatAed(product.price_aed)}</p>
          )}
        </div>
      )}
    </Link>
  );
}
