"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

export function SignatureCarousel({
  imageUrls,
  rotationSeconds = 5,
}: {
  imageUrls: string[];
  rotationSeconds?: number;
}) {
  const [index, setIndex] = useState(0);
  const n = imageUrls.length;
  const intervalMs = (rotationSeconds > 0 ? rotationSeconds : 5) * 1000;

  const go = useCallback(
    (delta: number) => {
      if (n <= 1) return;
      setIndex((i) => (i + delta + n) % n);
    },
    [n]
  );

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => go(1), intervalMs);
    return () => clearInterval(t);
  }, [n, go, intervalMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (imageUrls.length === 0) {
    return (
      <section
        className="aspect-[4/3] md:aspect-[21/9] bg-stone-100 flex items-center justify-center"
        aria-label="Image carousel"
      >
        <span className="text-stone-400 text-sm">No images</span>
      </section>
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-stone-100"
      aria-label="Featured saree images"
    >
      <div className="aspect-[4/3] md:aspect-[21/9] relative">
        {imageUrls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              zIndex: i === index ? 1 : 0,
            }}
            aria-hidden={i !== index}
          >
            <Image src={url} alt="" fill className="object-cover" sizes="100vw" unoptimized />
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" role="tablist" aria-label="Carousel slides">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${n}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i === index ? "bg-stone-800" : "bg-stone-300 hover:bg-stone-500"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center text-xl"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center text-xl"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
