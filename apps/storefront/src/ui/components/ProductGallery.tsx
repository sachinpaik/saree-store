"use client";

import { useState } from "react";
import Image from "next/image";
import {
  getProductImageAlt,
  getProductMainImageUrl,
  getThumbnailImageUrl,
  getVisibleProductImages,
  getZoomImageUrl,
} from "../../data/product-image";
import type { ProductImage } from "../../domain/types/storefront.types";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const list = getVisibleProductImages(images) as ProductImage[];
  const current = list[index];
  const currentSrc = current ? getProductMainImageUrl(current) : "";
  const currentZoomSrc = current ? getZoomImageUrl(current) : "";
  const currentAlt = getProductImageAlt(current, title);

  if (list.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[3px] bg-stone-100 text-sm text-stone-400">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[3px] bg-stone-100 text-left"
        aria-label="Open fullscreen image"
      >
        <Image
          src={currentSrc}
          alt={currentAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
      </button>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[2px] border ${
                i === index ? "border-[#c9962a]" : "border-transparent"
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <Image
                src={getThumbnailImageUrl(img)}
                alt={getProductImageAlt(img, title)}
                fill
                className="object-cover"
                sizes="56px"
                loading="lazy"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xl"
            aria-label="Close"
          >
            ×
          </button>
          <div className="relative w-full h-[90vh] max-w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentZoomSrc || currentSrc}
              alt={currentAlt}
              fill
              className="object-contain"
              sizes="100vw"
              loading="eager"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
