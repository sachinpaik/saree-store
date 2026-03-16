"use client";

import { useState } from "react";
import Image from "next/image";
import { getPublicImageUrl } from "../services/storefront.service";
import type { ProductImage } from "../types/storefront.types";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [];
  const current = list[index];
  const currentSrc = current ? getPublicImageUrl(current.storage_key) : "";
  const currentAlt = current?.alt_text ?? title;

  if (list.length === 0) {
    return (
      <div className="aspect-[3/4] bg-stone-100 rounded-sm flex items-center justify-center text-stone-400 text-sm">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] bg-stone-100 rounded-sm overflow-hidden">
        <Image
          src={currentSrc}
          alt={currentAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative w-14 h-14 shrink-0 rounded overflow-hidden border-2 ${
                i === index ? "border-stone-800" : "border-transparent"
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <Image
                src={getPublicImageUrl(img.storage_key)}
                alt={img.alt_text ?? ""}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
