import Link from "next/link";
import Image from "next/image";
import { PriceLine } from "./PriceLine";
import {
  getCardImageUrl,
  getPrimaryProductImage,
  getProductImageAlt,
} from "@/lib/product-image";
import type { Saree } from "@/lib/types";

export function SareeCard({ saree }: { saree: Saree }) {
  const primary = getPrimaryProductImage({ images: saree.images });
  const imageUrl = primary ? getCardImageUrl(primary) : undefined;

  return (
    <Link href={`/saree/${saree.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-stone-100 rounded-sm overflow-hidden mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={getProductImageAlt(primary, saree.title)}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">No image</div>
        )}
      </div>
      <h3 className="font-medium text-stone-900 text-sm line-clamp-2 group-hover:underline">
        {saree.title}
      </h3>
      <PriceLine saree={saree} />
    </Link>
  );
}
