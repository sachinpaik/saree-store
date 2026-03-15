import { StorefrontListingPage } from "./StorefrontListingPage";
import { listSarees } from "@/lib/data/sarees";

export const metadata = {
  title: "Kanchipuram Silks",
  description: "Browse our collection of Kanchipuram and silk sarees.",
};

/** Cache-friendly: server only fetches live data; no cookies(). Revalidate after admin changes. */
export const revalidate = 3600;

export default async function KanchipuramSilksPage() {
  const sarees = await listSarees();
  return <StorefrontListingPage initialSarees={sarees} />;
}
