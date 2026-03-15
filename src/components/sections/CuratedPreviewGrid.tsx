import Link from "next/link";
import { SareeGrid } from "@/components/saree/SareeGrid";
import { SareeCard } from "@/components/saree/SareeCard";
import { Container } from "@/components/layout/Container";
import type { Saree } from "@/lib/types";

const PREVIEW_LIMIT = 8;

export function CuratedPreviewGrid({ sarees }: { sarees: Saree[] }) {
  const items = sarees.slice(0, PREVIEW_LIMIT);

  return (
    <section className="py-16 md:py-20 bg-stone-50/50">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-stone-900 tracking-wide">
            Curated selection
          </h2>
        </div>
        <SareeGrid>
          {items.map((saree) => (
            <SareeCard key={saree.id} saree={saree} />
          ))}
        </SareeGrid>
        <div className="mt-10 flex justify-center">
          <Link
            href="/kanchipuram-silks"
            className="inline-block px-8 py-3 text-sm font-medium tracking-wide text-stone-800 border border-stone-300 rounded-sm hover:bg-stone-100 transition-colors"
          >
            View All Kanchipuram Silks
          </Link>
        </div>
      </Container>
    </section>
  );
}
