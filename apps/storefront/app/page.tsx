import {
  HomePage,
  getFeaturedProducts,
  getCarouselImageUrls,
  getSiteSettings,
  getStoreSettings,
} from "@/storefront";

const FEATURED_LIMIT = 8;
const CAROUSEL_LIMIT = 20;

export const dynamic = "force-static";

export default async function Page() {
  const [featuredProducts, siteSettings, storeSettings] = await Promise.all([
    getFeaturedProducts(FEATURED_LIMIT),
    getSiteSettings().catch(() => null),
    getStoreSettings().catch(() => null),
  ]);
  const carouselImageUrls = getCarouselImageUrls(siteSettings, CAROUSEL_LIMIT);
  const rotationSeconds = siteSettings?.homepage_rotation_seconds ?? 5;

  return (
    <HomePage
      featuredProducts={featuredProducts}
      carouselImageUrls={carouselImageUrls}
      rotationSeconds={rotationSeconds ?? undefined}
      whatsappNumber={storeSettings?.whatsapp_number ?? null}
      callNumber={storeSettings?.call_number ?? null}
    />
  );
}
