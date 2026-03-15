import { StorefrontHomePage } from "./StorefrontHomePage";
import { getCarouselImageUrls, listSareesForHomepage } from "@/lib/data/sarees";
import { getSiteSettings } from "@/lib/data/site-settings";

const PREVIEW_LIMIT = 8;

/** Cache-friendly: server only fetches live data; no cookies(). Revalidate after admin changes. */
export const revalidate = 3600;

export default async function HomePage() {
  const [sarees, carouselUrls, siteSettings] = await Promise.all([
    listSareesForHomepage(PREVIEW_LIMIT),
    getCarouselImageUrls(20),
    getSiteSettings().catch(() => null),
  ]);
  const rotationSeconds = siteSettings?.homepage_rotation_seconds ?? 5;

  return (
    <StorefrontHomePage
      initialSarees={sarees}
      initialCarouselUrls={carouselUrls}
      rotationSeconds={rotationSeconds ?? undefined}
    />
  );
}
