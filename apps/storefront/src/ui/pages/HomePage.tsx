"use client";

import Image from "next/image";
import Link from "next/link";
import { Carousel } from "../components/Carousel";
import {
  getCardImageUrl,
  getPrimaryProductImage,
  getProductImageAlt,
} from "../../data/product-image";
import { formatAed, formatInr } from "../../domain/utils/format-price";
import type { Product } from "../../domain/types/storefront.types";

function buildWhatsAppHref(number: string | null | undefined, message: string): string | null {
  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function HomeProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const primary = getPrimaryProductImage({ images: product.images });
  const imageUrl = primary ? getCardImageUrl(primary) : undefined;
  const showInr = product.price_inr > 0;
  const showAed = product.price_aed > 0;
  const badge =
    product.stock_status === "low_stock"
      ? "Low stock"
      : product.show_on_homepage
        ? "Featured"
        : null;

  return (
    <Link
      href={`/saree/${product.slug}`}
      className="group block rounded-[1.35rem] border border-[#d8ccb7] bg-[#faf6ee] p-3 shadow-[0_18px_45px_rgba(26,16,8,0.05)] transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1rem] bg-[#efe4d2]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={getProductImageAlt(primary, product.title)}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#7b6b5c]">
            No image
          </div>
        )}
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#1a1008]/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#f5edd8]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="px-1 pb-1 pt-4">
        {product.sku ? (
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#8a6f54]">
            {product.sku}
          </p>
        ) : null}
        <h3 className="font-serif text-xl leading-tight text-[#1a1008] group-hover:text-[#7d5d2f]">
          {product.title}
        </h3>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            {showInr ? (
              <p className="text-base font-medium text-[#1a1008]">{formatInr(product.price_inr)}</p>
            ) : (
              <p className="text-base font-medium text-[#1a1008]">Enquire for price</p>
            )}
            {showAed ? (
              <p className="mt-0.5 text-xs text-[#786757]">{formatAed(product.price_aed)}</p>
            ) : null}
          </div>
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#a7772b]">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HomePage({
  featuredProducts,
  carouselImageUrls,
  rotationSeconds = 5,
  whatsappNumber,
  callNumber,
}: {
  featuredProducts: Product[];
  carouselImageUrls: string[];
  rotationSeconds?: number;
  whatsappNumber?: string | null;
  callNumber?: string | null;
}) {
  const browseHref = "/kanchipuram-silks";
  const whatsappEnquiryHref = buildWhatsAppHref(
    whatsappNumber,
    "Hi, I'm interested in bulk / wholesale ordering. Could you please share your trade pricing and minimum order details?"
  );
  const whatsappQuickHref = buildWhatsAppHref(
    whatsappNumber,
    "Hi, I'd like to enquire about your saree collection."
  );
  const callHref = callNumber ? `tel:${callNumber.replace(/\s/g, "")}` : null;

  const featuredCount = featuredProducts.length;
  const lowStockCount = featuredProducts.filter((product) => product.stock_status === "low_stock").length;
  const withAedPricing = featuredProducts.filter((product) => product.price_aed > 0).length;
  const spotlightProducts = featuredProducts.slice(0, 4);

  const carouselOverlay = (
    <div className="space-y-4 rounded-[1.5rem] border border-[#e8d8be]/35 bg-[#1a1008]/60 px-5 py-7 text-[#faf7f2] shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur-md md:px-6 md:py-8">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f2cf7d]">
          UAE &amp; India Heritage Silk
        </p>
        <p className="max-w-sm text-[13px] leading-relaxed text-white/78 md:text-sm">
          Handpicked Kanchipuram sarees sourced for trust, detail, and direct buyer conversation across UAE and India.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={browseHref}
          className="inline-flex items-center rounded-full bg-[#c9962a] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1a1008] transition-colors hover:bg-[#ddb24d]"
        >
          Shop Collection
        </Link>
        {whatsappQuickHref && (
          <a
            href={whatsappQuickHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/18 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/76 transition-colors hover:bg-white/8 hover:text-white"
          >
            <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.112 1.523 5.842L.057 23.486a.5.5 0 00.619.61l5.783-1.517A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.798 9.798 0 01-5.015-1.375l-.36-.214-3.732.979.996-3.638-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
            </svg>
            Book Consultation
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <span className="rounded-full border border-[#e8c96e]/25 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f4e7c9]/82">
          Direct from weavers
        </span>
        <span className="rounded-full border border-[#e8c96e]/25 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f4e7c9]/82">
          UAE &amp; India delivery
        </span>
        <span className="rounded-full border border-[#e8c96e]/25 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f4e7c9]/82">
          Retail &amp; wholesale
        </span>
      </div>
    </div>
  );

  const heroBadge = (
    <div className="hidden md:flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[#e8c96e]/30 bg-[#102318]/60 text-center text-[#f4eadc] shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <p className="font-serif text-4xl italic leading-none text-[#e8c96e]">0</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#f4eadc]/70 md:text-[10px]">
        Middlemen
      </p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#e8c96e] md:text-[10px]">
        Direct from weavers
      </p>
    </div>
  );

  return (
    <>
      <Carousel
        imageUrls={carouselImageUrls}
        rotationSeconds={rotationSeconds}
        overlayContent={carouselOverlay}
        badgeContent={heroBadge}
      />

      {/*<section className="border-b border-[#d8ccb7] bg-[#f3ead9]">*/}
      {/*  <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 md:grid-cols-3 md:gap-4">*/}
      {/*    <div>*/}
      {/*      <p className="text-[10px] uppercase tracking-[0.18em] text-[#a7772b]">Authentic silk</p>*/}
      {/*      <p className="mt-1 text-sm text-[#4d3a2b]">*/}
      {/*        Handpicked Kanchipuram sarees presented with a premium, trust-first shopping experience.*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <p className="text-[10px] uppercase tracking-[0.18em] text-[#a7772b]">UAE &amp; India delivery</p>*/}
      {/*      <p className="mt-1 text-sm text-[#4d3a2b]">*/}
      {/*        Designed for buyers across both markets with clear support for enquiries, pricing, and direct assistance.*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*    <div>*/}
      {/*      <p className="text-[10px] uppercase tracking-[0.18em] text-[#a7772b]">Direct WhatsApp support</p>*/}
      {/*      <p className="mt-1 text-sm text-[#4d3a2b]">*/}
      {/*        {whatsappNumber*/}
      {/*          ? "Customers can move from discovery to conversation instantly without a long checkout flow."*/}
      {/*          : "Add a WhatsApp number in admin to activate guided buyer enquiry CTAs."}*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</section>*/}

      <section className="bg-[#fbf7f0]">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#a7772b]">Featured collection</p>
              <h2 className="mt-2 font-serif text-3xl text-[#1a1008] md:text-4xl">
                Signature Kanchipuram selections
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d4a39]">
                A more editorial homepage grid with stronger hierarchy, luxury spacing, and product-first
                storytelling built from the existing approved catalogue.
              </p>
            </div>
            <Link
              href={browseHref}
              className="inline-flex items-center text-[11px] font-medium uppercase tracking-[0.18em] text-[#a7772b]"
            >
              View all products
            </Link>
          </div>

          {spotlightProducts.length > 0 ? (
            <div className="mb-14 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 md:mb-20">
              {spotlightProducts.map((product, index) => (
                <HomeProductCard key={product.id} product={product} eager={index < 2} />
              ))}
            </div>
          ) : (
            <div className="mb-14 rounded-[1.5rem] border border-dashed border-[#d8ccb7] bg-white px-6 py-12 text-center text-sm text-[#7b6b5c] md:mb-20">
              No featured products are currently marked for the homepage.
            </div>
          )}

          <div className="mb-10 text-center md:mb-12">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#a7772b]">Why choose us</p>
            <h2 className="mt-3 font-serif text-3xl text-[#1a1008] md:text-5xl">
              The Suganda Difference
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-sm border-l-2 border-[#c9962a] bg-white p-7 shadow-[0_18px_50px_rgba(26,16,8,0.05)]">
              <p className="font-serif text-4xl italic leading-none text-[#c9962a]">01</p>
              <h3 className="mt-4 font-medium text-[#1a1008]">Direct from Weavers</h3>
              <p className="mt-2 text-sm leading-6 text-[#5d4a39]">
                No middlemen. We work directly with master weavers in Kanchipuram for the best prices.
              </p>
            </div>
            {/*<div className="rounded-sm border-l-2 border-[#c9962a] bg-white p-7 shadow-[0_18px_50px_rgba(26,16,8,0.05)]">*/}
            {/*  <p className="font-serif text-4xl italic leading-none text-[#c9962a]">02</p>*/}
            {/*  <h3 className="mt-4 font-medium text-[#1a1008]">GI Certified Silk</h3>*/}
            {/*  <p className="mt-2 text-sm leading-6 text-[#5d4a39]">*/}
            {/*    Every saree comes with a Geographical Indication tag authenticating its origin.*/}
            {/*  </p>*/}
            {/*</div>*/}
            <div className="rounded-sm border-l-2 border-[#c9962a] bg-white p-7 shadow-[0_18px_50px_rgba(26,16,8,0.05)]">
              <p className="font-serif text-4xl italic leading-none text-[#c9962a]">02</p>
              <h3 className="mt-4 font-medium text-[#1a1008]">Wholesale Rates</h3>
              <p className="mt-2 text-sm leading-6 text-[#5d4a39]">
                Boutiques and resellers welcome. Competitive bulk pricing with flexible MOQ.
              </p>
            </div>
            <div className="rounded-sm border-l-2 border-[#c9962a] bg-white p-7 shadow-[0_18px_50px_rgba(26,16,8,0.05)]">
              <p className="font-serif text-4xl italic leading-none text-[#c9962a]">03</p>
              <h3 className="mt-4 font-medium text-[#1a1008]">Custom Weaving</h3>
              <p className="mt-2 text-sm leading-6 text-[#5d4a39]">
                Place bespoke orders for weddings - choose your color, border, and motif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {whatsappEnquiryHref ? (
        <section className="bg-[#0f291d]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:py-12">
            <div className="max-w-3xl">
              <h2 className="font-serif text-3xl leading-tight text-[#f4eadc] md:text-5xl md:leading-[1.05]">
                Ready to find your perfect
                <br />
                <span className="italic text-[#d0a75a]">saree?</span> Speak with us directly.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f6ead6]">
                Share your preferred colors, occasion, budget, or quantity and we will help you narrow
                down the right pieces faster.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <a
                href={whatsappEnquiryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[180px] items-center justify-center rounded-sm bg-[#25d366] px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-[#1ebe5d]"
              >
                WhatsApp Us
              </a>
              {callHref ? (
                <a
                  href={callHref}
                  className="inline-flex min-w-[140px] items-center justify-center rounded-sm border border-[#d6c2a1]/40 bg-white/6 px-6 py-4 text-sm font-medium text-[#f6ead6] transition-colors hover:bg-white/10 hover:text-white"
                >
                  Call Now
                </a>
              ) : (
                <Link
                  href="/information"
                  className="inline-flex min-w-[140px] items-center justify-center rounded-sm border border-[#d6c2a1]/40 bg-white/6 px-6 py-4 text-sm font-medium text-[#f6ead6] transition-colors hover:bg-white/10 hover:text-white"
                >
                  Contact Us
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#0f291d]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:py-12">
            <div className="max-w-3xl">
              <h2 className="font-serif text-3xl leading-tight text-[#f4eadc] md:text-5xl md:leading-[1.05]">
                Ready to find your perfect
                <br />
                <span className="italic text-[#d0a75a]">saree?</span> Speak with us directly.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f6ead6]">
                Share your preferred colors, occasion, budget, or quantity and we will help you narrow
                down the right pieces faster.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <Link
                href="/information"
                className="inline-flex min-w-[160px] items-center justify-center rounded-sm border border-[#d6c2a1]/40 bg-white/6 px-6 py-4 text-sm font-medium text-[#f6ead6] transition-colors hover:bg-white/10 hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
