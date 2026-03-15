"use client";

import { useState, useMemo } from "react";
import { SareeGrid } from "@/components/saree/SareeGrid";
import { SareeCard } from "@/components/saree/SareeCard";
import { Container } from "@/components/layout/Container";
import type { Saree } from "@/lib/types";

export function KanchipuramSilksClient({ initialSarees, previewMode }: { initialSarees: Saree[]; previewMode?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return initialSarees;
    const q = query.toLowerCase().trim();
    return initialSarees.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.sku?.toLowerCase().includes(q) ?? false)
    );
  }, [initialSarees, query]);

  return (
    <div className={`py-10 md:py-14 ${previewMode ? "mt-12" : ""}`}>
      <Container>
        <div className="mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-stone-900 tracking-wide mb-2">
            Kanchipuram Silks
          </h1>
          <p className="text-stone-600 text-sm max-w-xl">
            Our full collection of handpicked Kanchipuram and silk sarees.
          </p>
        </div>
        <div className="mb-8 max-w-xs">
          <label htmlFor="search" className="sr-only">
            Search by title or SKU
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by title or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-sm placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
        <SareeGrid>
          {filtered.map((saree) => (
            <SareeCard key={saree.id} saree={saree} />
          ))}
        </SareeGrid>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-stone-500 text-sm">No sarees match your search.</p>
        )}
      </Container>
    </div>
  );
}
