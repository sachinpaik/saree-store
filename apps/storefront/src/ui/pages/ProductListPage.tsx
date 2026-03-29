import Link from "next/link";
import { ProductListClient } from "../components/ProductListClient";
import type { Product } from "../../domain/types/storefront.types";

function buildWhatsAppHref(number: string | null | undefined, message: string) {
  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  return clean ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}` : null;
}

export function ProductListPage({
  products,
  whatsappNumber,
}: {
  products: Product[];
  whatsappNumber?: string | null;
}) {
  const count = products.length;
  const whatsappHref = buildWhatsAppHref(
    whatsappNumber,
    "Hi, I would like help choosing from your Kanchipuram silk collection."
  );

  return (
    <div className="bg-[#faf7f2] py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="border-b border-[#1a1008]/10 pb-4 text-[11px] tracking-[0.04em] text-[#1a1008]/42" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#1a1008]">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#c9962a]">Kanchipuram Silks</li>
          </ol>
        </nav>

        <div className="mb-8 mt-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-serif text-[2.3rem] leading-[1.05] text-[#1a1008] md:text-[3rem]">
              Kanchipuram Silks
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#1a1008]/55">
              Pure and blended Kanchipuram sarees curated for boutiques, resellers, and individual
              buyers who want a stronger product presentation with direct enquiry support.
            </p>
          </div>
          <div className="self-start rounded-[2px] bg-[#f0ebe3] px-4 py-2 text-[12px] font-medium tracking-[0.05em] text-[#7a5c2e]">
            {count} saree{count === 1 ? "" : "s"}
          </div>
        </div>

        <ProductListClient products={products} whatsappHref={whatsappHref} />
      </div>
    </div>
  );
}
