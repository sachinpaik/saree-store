import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ProductDetailPage,
  getApprovedProductBySlug,
  getApprovedProductSlugs,
  getStoreSettings,
  getProductSpecsForDisplay,
} from "@/storefront";

type Props = { params: Promise<{ slug: string }> };

/** Static: all approved product slugs pre-rendered at build. */
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getApprovedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getApprovedProductBySlug(slug);
  if (!product) return { title: "Saree" };
  return {
    title: product.title,
    description: product.description ?? undefined,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await getApprovedProductBySlug(slug);
  if (!product) notFound();

  const [storeSettings, specs] = await Promise.all([
    getStoreSettings(),
    getProductSpecsForDisplay(product.id, product.attributes),
  ]);

  const whatsappNumber = storeSettings?.whatsapp_number?.trim() ?? null;
  const callNumber = storeSettings?.call_number?.trim() ?? null;
  const defaultTemplate =
    "Interested in: " + product.title + (product.sku ? " (" + product.sku + ")" : "");
  const template =
    storeSettings?.whatsapp_message_template
      ?.replace(/\{title\}/g, product.title)
      .replace(/\{sku\}/g, product.sku ?? "") ?? defaultTemplate;

  return (
    <ProductDetailPage
      product={product}
      slug={slug}
      settings={{
        whatsappNumber,
        callNumber,
        template,
      }}
      specs={specs ?? {}}
    />
  );
}
