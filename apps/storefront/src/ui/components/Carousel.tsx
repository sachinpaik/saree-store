"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export function Carousel({
  imageUrls,
  rotationSeconds = 5,
  overlayContent,
  badgeContent,
}: {
  imageUrls: string[];
  rotationSeconds?: number;
  overlayContent?: React.ReactNode;
  badgeContent?: React.ReactNode;
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
        className="aspect-[8/3] md:aspect-[16/5] bg-stone-100 flex items-center justify-center"
        aria-label="Carousel"
      >
        <span className="text-stone-400 text-sm">No images</span>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-stone-100" aria-label="Featured images">
      <div className="aspect-[8/3] md:aspect-[16/5] relative">
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
              className="scale-[1.01] object-cover transition-transform duration-[5000ms] ease-out"
              sizes="100vw"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              unoptimized
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,18,13,0.72)_0%,rgba(8,18,13,0.42)_38%,rgba(8,18,13,0.14)_68%,rgba(8,18,13,0.06)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.24)_100%)]" />
          </div>
        ))}
      </div>
      {overlayContent && (
        <div className="absolute left-4 bottom-8 md:left-8 md:bottom-10 z-10 max-w-[82%] md:max-w-[25rem]">
          {overlayContent}
        </div>
      )}
      {badgeContent && (
        <div className="absolute right-4 top-16 z-10 md:right-8 md:top-8">
          {badgeContent}
        </div>
      )}
      {n > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-5">
          {imageUrls.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === index ? "h-1.5 w-10 bg-[#f3dfad]" : "h-1.5 w-6 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
