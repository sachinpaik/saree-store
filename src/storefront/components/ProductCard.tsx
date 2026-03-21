import Link from "next/link";
import Image from "next/image";
import { getPublicImageUrl } from "../services/storefront.service";
import type { Product } from "../types/storefront.types";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images[0]?.storage_key
    ? getPublicImageUrl(product.images[0].storage_key)
    : undefined;

  const hasSku = Boolean(product.sku && product.sku.trim().length > 0);

  return (
    <Link href={`/saree/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-surface rounded-sm overflow-hidden mb-3 border border-rim/60">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.images[0]?.alt_text ?? product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
            No image
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
          "text-foreground"
        }`}
      >
        {product.title}
      </h3>
    </Link>
  );
}
