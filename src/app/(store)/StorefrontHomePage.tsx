"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { SignatureCarousel } from "@/components/sections/SignatureCarousel";
import { BrandStory } from "@/components/sections/BrandStory";
import { CuratedPreviewGrid } from "@/components/sections/CuratedPreviewGrid";
import type { Saree } from "@/lib/types";

const PREVIEW_BAR_SLOT_ID = "home-preview-bar-slot";

const HomePreviewBridge = dynamic(
  () => import("./HomePreviewBridge").then((m) => m.HomePreviewBridge),
  { ssr: false }
);

export function StorefrontHomePage({
  initialSarees,
  initialCarouselUrls,
  rotationSeconds,
}: {
  initialSarees: Saree[];
  initialCarouselUrls: string[];
  rotationSeconds?: number;
}) {
  const [sarees, setSarees] = useState<Saree[]>(initialSarees);
  const [carouselUrls, setCarouselUrls] = useState<string[]>(initialCarouselUrls);
  const [previewStatus, setPreviewStatus] = useState<{
    isAdmin: boolean;
    previewEnabled: boolean;
  } | null>(null);

  const onDraftData = useCallback((s: Saree[], u: string[]) => {
    setSarees(s);
    setCarouselUrls(u);
  }, []);

  return (
    <>
      <div id={PREVIEW_BAR_SLOT_ID} />
      <HomePreviewBridge
        onStatus={setPreviewStatus}
        onDraftData={onDraftData}
        previewBarSlotId={PREVIEW_BAR_SLOT_ID}
      />
      <div className={previewStatus?.isAdmin ? "mt-12" : ""}>
        <SignatureCarousel
          imageUrls={carouselUrls}
          rotationSeconds={rotationSeconds ?? undefined}
        />
        <BrandStory />
        <CuratedPreviewGrid sarees={sarees} />
      </div>
    </>
  );
}
