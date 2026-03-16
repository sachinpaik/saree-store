import { ProductListPage, getApprovedProducts } from "@/storefront";

export const metadata = {
  title: "Kanchipuram Silks",
  description: "Browse our collection of Kanchipuram and silk sarees.",
};

/** Static: data from Supabase at build time via storefront layer. */
export const dynamic = "force-static";

export default async function Page() {
  const products = await getApprovedProducts();
  return <ProductListPage products={products} />;
}
