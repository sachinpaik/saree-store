"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import type { SareeImage } from "@/lib/types";
import {
  getProductImageAlt,
  getProductMainImageUrl,
  getThumbnailImageUrl,
  getVisibleProductImages,
  getZoomImageUrl,
} from "@/lib/product-image";

const ZOOM_LENS_SIZE = 140;
const ZOOM_FACTOR = 2.2;

export function SareeGallery({ images, title }: { images: SareeImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [magnifier, setMagnifier] = useState<{ x: number; y: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const list = getVisibleProductImages(images) as SareeImage[];
  const currentSrc = list[index] ? getProductMainImageUrl(list[index]) : "";
  const currentZoomSrc = list[index] ? getZoomImageUrl(list[index]) : currentSrc;
  const currentAlt = getProductImageAlt(list[index], title);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setMagnifier({ x, y });
      } else {
        setMagnifier(null);
      }
    },
    []
  );
  const handleMouseLeave = useCallback(() => setMagnifier(null), []);

  if (list.length === 0) {
    return (
      <div className="aspect-[3/4] bg-stone-100 rounded-sm flex items-center justify-center text-stone-400 text-sm">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] bg-stone-100 rounded-sm overflow-hidden group cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setFullscreen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFullscreen(true);
          }
        }}
        aria-label="View full size"
      >
        <Image
          src={currentSrc}
          alt={currentAlt}
          fill
          className="object-cover select-none"
          draggable={false}
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        {/* Hover magnifier (desktop) - dynamic positioning requires img */}
        {magnifier && containerRef.current && (
          <div
            className="hidden md:block absolute pointer-events-none border-2 border-stone-300 rounded-full bg-stone-100 shadow-lg overflow-hidden"
            style={{
              width: ZOOM_LENS_SIZE,
              height: ZOOM_LENS_SIZE,
              left: Math.max(0, Math.min(magnifier.x - ZOOM_LENS_SIZE / 2, containerRef.current.offsetWidth - ZOOM_LENS_SIZE)),
              top: Math.max(0, Math.min(magnifier.y - ZOOM_LENS_SIZE / 2, containerRef.current.offsetHeight - ZOOM_LENS_SIZE)),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentZoomSrc}
              alt=""
              className="absolute object-cover"
              style={{
                width: containerRef.current.offsetWidth * ZOOM_FACTOR,
                height: containerRef.current.offsetHeight * ZOOM_FACTOR,
                left: -magnifier.x * ZOOM_FACTOR + ZOOM_LENS_SIZE / 2,
                top: -magnifier.y * ZOOM_FACTOR + ZOOM_LENS_SIZE / 2,
              }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Image thumbnails">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`shrink-0 w-14 h-14 rounded-sm overflow-hidden border-2 transition ${
                i === index ? "border-stone-800" : "border-transparent hover:border-stone-300"
              }`}
            >
              <Image src={getThumbnailImageUrl(img)} alt={getProductImageAlt(img, title)} width={56} height={56} className="w-full h-full object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen modal (mobile tap / desktop click) */}
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
          <div
            className="relative w-full h-[90vh] max-w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentZoomSrc}
              alt={currentAlt}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
