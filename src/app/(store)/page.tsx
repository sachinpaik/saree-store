import {
  HomePage,
  getFeaturedProducts,
  getCarouselImageUrls,
  getSiteSettings,
} from "@/storefront";

const FEATURED_LIMIT = 8;
const CAROUSEL_LIMIT = 20;

/** Static: data from Supabase at build time via storefront layer. */
export const dynamic = "force-static";

export default async function Page() {
  const [featuredProducts, siteSettings] = await Promise.all([
    getFeaturedProducts(FEATURED_LIMIT),
    getSiteSettings().catch(() => null),
  ]);
  const carouselImageUrls = getCarouselImageUrls(siteSettings, CAROUSEL_LIMIT);
  const rotationSeconds = siteSettings?.homepage_rotation_seconds ?? 5;

  return (
    <HomePage
      featuredProducts={featuredProducts}
      carouselImageUrls={carouselImageUrls}
      rotationSeconds={rotationSeconds ?? undefined}
    />
  );
}
