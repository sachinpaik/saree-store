"use client";

import Link from "next/link";
import { Carousel } from "../components/Carousel";
import { ProductGrid } from "../components/ProductGrid";
import type { Product } from "../types/storefront.types";

function buildWhatsAppHref(number: string | null | undefined, message: string): string | null {
  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function HomePage({
  featuredProducts,
  carouselImageUrls,
  rotationSeconds = 5,
  whatsappNumber,
}: {
  featuredProducts: Product[];
  carouselImageUrls: string[];
  rotationSeconds?: number;
  whatsappNumber?: string | null;
}) {
  const browseHref = "/kanchipuram-silks";
  const whatsappEnquiryHref = buildWhatsAppHref(
    whatsappNumber,
    "Hi, I'm interested in bulk / wholesale ordering. Could you please share your trade pricing and minimum order details?"
  );
  const whatsappQuickHref = buildWhatsAppHref(whatsappNumber, "Hi, I'd like to enquire about your saree collection.");

  const carouselOverlay = (
    <div className="bg-surface/90 backdrop-blur-sm rounded-sm px-4 py-4 md:px-5 md:py-5 space-y-3 shadow-sm border border-rim/60">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-accentGold uppercase mb-1">
          Premium Collection
        </p>
        <h2 className="font-serif text-foreground text-lg md:text-xl leading-snug">
          Kanchipuram Silks
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Direct from weavers. Retail &amp; wholesale welcome.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link
          href={browseHref}
          className="inline-flex items-center px-3 py-1.5 bg-accentBerry text-white text-xs font-medium rounded-sm hover:bg-accentBerry/90 transition-colors"
        >
          Browse Collection
        </Link>
        {whatsappQuickHref && (
          <a
            href={whatsappQuickHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rim text-foreground text-xs font-medium rounded-sm hover:bg-background transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.112 1.523 5.842L.057 23.486a.5.5 0 00.619.61l5.783-1.517A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.798 9.798 0 01-5.015-1.375l-.36-.214-3.732.979.996-3.638-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            WhatsApp Us
          </a>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Carousel
        imageUrls={carouselImageUrls}
        rotationSeconds={rotationSeconds}
        overlayContent={carouselOverlay}
      />

      {whatsappEnquiryHref && (
        <section className="bg-surface border-b border-rim">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm">Bulk &amp; Wholesale Enquiries</p>
              <p className="text-muted text-[13px] mt-0.5">
                Ordering 10+ sarees? We offer trade pricing and fast dispatch.
              </p>
            </div>
            <a
              href={whatsappEnquiryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-sm hover:bg-green-700"
            >
              WhatsApp for bulk pricing
            </a>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-xl md:text-2xl text-foreground">Featured</h2>
              <p className="text-sm text-muted mt-1">Selected pieces from our collection.</p>
            </div>
            <Link
              href={browseHref}
              className="text-sm font-medium text-accentBerry hover:underline"
            >
              View all →
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}
    </>
  );
}
