import { ProductListPage, getApprovedProducts, getStoreSettings } from "@/storefront";

export const metadata = {
  title: "Kanchipuram Silks",
  description: "Browse our collection of Kanchipuram and silk sarees.",
};

export const dynamic = "force-static";

export default async function Page() {
  const [products, storeSettings] = await Promise.all([
    getApprovedProducts(),
    getStoreSettings().catch(() => null),
  ]);

  return (
    <ProductListPage
      products={products}
      whatsappNumber={storeSettings?.whatsapp_number ?? null}
    />
  );
}
