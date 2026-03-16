import Link from "next/link";
import Image from "next/image";
import { getPublicImageUrl } from "../services/storefront.service";
import type { Product } from "../types/storefront.types";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images[0]?.storage_key
    ? getPublicImageUrl(product.images[0].storage_key)
    : undefined;

  return (
    <Link href={`/saree/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-stone-100 rounded-sm overflow-hidden mb-3">
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
      <h3 className="font-medium text-stone-900 text-sm line-clamp-2 group-hover:underline">
        {product.title}
      </h3>
      <p className="text-stone-600 text-sm mt-0.5">
        ₹{product.price_inr.toLocaleString("en-IN")}
        {product.price_aed > 0 && ` · AED ${product.price_aed}`}
      </p>
    </Link>
  );
}
