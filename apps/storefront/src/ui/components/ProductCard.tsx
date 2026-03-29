import Link from "next/link";
import Image from "next/image";
import {
  getCardImageUrl,
  getPrimaryProductImage,
  getProductImageAlt,
} from "../../data/product-image";
import { formatAed, formatInr } from "../../domain/utils/format-price";
import type { Product } from "../../domain/types/storefront.types";

function getProductSubtitle(product: Product): string {
  const attrs = product.attributes ?? {};
  const collectionType =
    typeof attrs.collection_type === "string"
      ? attrs.collection_type
      : typeof attrs.silk_type === "string"
        ? attrs.silk_type
        : typeof attrs.fabric === "string"
          ? attrs.fabric
          : null;

  if (collectionType) return `${collectionType} · Kanchipuram silk`;
  return "Kanchipuram silk collection";
}

function getBadge(product: Product): { label: string; tone: string } | null {
  if (product.featured) {
    return { label: "Featured", tone: "bg-[#c9a96e] text-[#1a3a2a]" };
  }
  if (product.stock_status === "low_stock") {
    return { label: "Low stock", tone: "bg-[#1a3a2a] text-[#c9a96e]" };
  }
  return null;
}

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const primary = getPrimaryProductImage({ images: product.images });
  const imageUrl = primary ? getCardImageUrl(primary) : undefined;
  const badge = getBadge(product);
  const hasSku = Boolean(product.sku && product.sku.trim().length > 0);
  const showInr = product.price_inr > 0;
  const showAed = product.price_aed > 0;
  const isOut = product.stock_status === "out_of_stock";

  return (
    <Link href={`/saree/${product.slug}`} className="group block cursor-pointer">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-[4px] border border-[#1a1008]/10 bg-[#f5f0eb]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={getProductImageAlt(primary, product.title)}
            fill
            className={`object-cover transition duration-500 group-hover:scale-[1.03] ${isOut ? "opacity-50 grayscale-[0.35]" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#1a1008]/40">
            No image
          </div>
        )}

        {badge ? (
          <span className={`absolute left-3 top-3 rounded-[2px] px-3 py-1 text-[9px] font-medium uppercase tracking-[0.12em] ${badge.tone}`}>
            {badge.label}
          </span>
        ) : null}

        {isOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1008]/30">
            <span className="rounded-[2px] bg-[#1a1008]/85 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-white">
              Out of stock
            </span>
          </div>
        ) : null}
      </div>

      {hasSku ? (
        <p className="mb-1 text-[10px] tracking-[0.08em] text-[#1a1008]/35">{product.sku}</p>
      ) : null}

      <h3 className="font-serif text-[1.08rem] leading-[1.3] text-[#1a1008] transition-colors group-hover:text-[#7a5c2e]">
        {product.title}
      </h3>
      <p className="mt-1 text-[11px] tracking-[0.04em] text-[#1a1008]/52">{getProductSubtitle(product)}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {showInr ? (
            <p className="text-[15px] font-medium text-[#1a3a2a]">{formatInr(product.price_inr)}</p>
          ) : (
            <p className="text-[15px] font-medium text-[#1a3a2a]">Contact for price</p>
          )}
          {showAed ? <p className="mt-1 text-[11px] text-[#1a1008]/38">{formatAed(product.price_aed)}</p> : null}
        </div>
        <span className="whitespace-nowrap border-b border-[#c9a96e] pb-0.5 text-[11px] uppercase tracking-[0.08em] text-[#c9a96e]">
          Enquire
        </span>
      </div>
    </Link>
  );
}
