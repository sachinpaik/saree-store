import Link from "next/link";
import Image from "next/image";
import { PriceLine } from "./PriceLine";
import { getMediaUrl } from "@/lib/media-url";
import type { Saree } from "@/lib/types";

export function SareeCard({ saree }: { saree: Saree }) {
  const imageUrl = saree.images[0]?.storage_key ? getMediaUrl(saree.images[0].storage_key) : undefined;

  return (
    <Link href={`/saree/${saree.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-stone-100 rounded-sm overflow-hidden mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 400px"
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
