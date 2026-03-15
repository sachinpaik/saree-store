import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSareeBySlug } from "@/lib/data/sarees";
import { getProductSpecsForDisplay } from "@/lib/data/attribute-definitions";
import { createClient } from "@/lib/supabase/server";
import { StorefrontDetailPage } from "./StorefrontDetailPage";

type Props = { params: Promise<{ slug: string }> };

/** Cache-friendly: server only fetches live data; no cookies(). Revalidate after admin changes. */
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const saree = await getSareeBySlug(slug);
  if (!saree) return { title: "Saree" };
  return {
    title: saree.title,
    description: saree.description ?? undefined,
  };
}

export default async function SareeDetailPage({ params }: Props) {
  const { slug } = await params;
  const saree = await getSareeBySlug(slug);
  if (!saree) notFound();

  const [settingsResult, specs] = await Promise.all([
    createClient().then((s) =>
      s.from("store_settings").select("whatsapp_number, call_number, whatsapp_message_template").limit(1).single()
    ),
    getProductSpecsForDisplay(saree.id, saree.attributes),
  ]);

  const settings = settingsResult.data;
  const whatsappNumber = settings?.whatsapp_number?.trim() ?? null;
  const callNumber = settings?.call_number?.trim() ?? null;
  const template =
    settings?.whatsapp_message_template?.replace(/\{title\}/g, saree.title).replace(/\{sku\}/g, saree.sku ?? "") ??
    `Interested in: ${saree.title}${saree.sku ? ` (${saree.sku})` : ""};

  return (
    <StorefrontDetailPage
      initialSaree={saree}
      slug={slug}
      settings={{
        whatsappNumber,
        callNumber,
        template,
      }}
      initialSpecs={specs ?? {}}
    />
  );
}
