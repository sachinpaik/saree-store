"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export function Carousel({
  imageUrls,
  rotationSeconds = 5,
  overlayContent,
}: {
  imageUrls: string[];
  rotationSeconds?: number;
  overlayContent?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const n = imageUrls.length;
  const intervalMs = (rotationSeconds > 0 ? rotationSeconds : 5) * 1000;
  const go = useCallback((delta: number) => {
    if (n <= 1) return;
    setIndex((i) => (i + delta + n) % n);
  }, [n]);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => go(1), intervalMs);
    return () => clearInterval(t);
  }, [n, go, intervalMs]);

  if (n === 0) {
    return (
      <section
        className="aspect-[8/3] md:aspect-[14/3] bg-stone-100 flex items-center justify-center"
        aria-label="Carousel"
      >
        <span className="text-stone-400 text-sm">No images</span>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-stone-100" aria-label="Featured images">
      <div className="aspect-[8/3] md:aspect-[14/3] relative">
        {imageUrls.map((url, i) => (
          <div
            key={`${i}-${url}`}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              unoptimized
            />
          </div>
        ))}
      </div>
      {overlayContent && (
        <div className="absolute left-4 bottom-10 md:left-8 md:bottom-10 z-10 max-w-[85%] md:max-w-sm">
          {overlayContent}
        </div>
      )}
      {n > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {imageUrls.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-8 rounded-full ${i === index ? "bg-white/90" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
