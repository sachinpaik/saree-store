"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EditProductClientLayout } from "@/components/admin/EditProductClientLayout";
import { getActiveAttributeDefinitions, getAllAttributeDefinitions } from "@/lib/data/attribute-definitions";

function EditProductPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [node, setNode] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (!id) {
      setNode(
        <div className="text-stone-600">
          <p>Missing product id. Open a product from the list.</p>
        </div>
      );
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const [
        { data: product, error },
        { data: types },
        attributeDefinitions,
        allAttributeDefinitions,
        { data: attributeRows },
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            `
        *,
        product_images(id, storage_key, image_url, original_url, thumb_url, medium_url, large_url, sort_order, alt_text, image_tag, status, width, height, is_primary, show_on_homepage)
      `
          )
          .eq("id", id)
          .single(),
        supabase.from("types").select("id, name, slug").order("sort_order", { ascending: true }),
        getActiveAttributeDefinitions().catch(() => []),
        getAllAttributeDefinitions().catch(() => []),
        supabase.from("product_attribute_values").select("attribute_key, value").eq("product_id", id),
      ]);

      if (cancelled) return;

      if (error || !product) {
        setNode(<div className="text-stone-600">Product not found.</div>);
        return;
      }

      const images = (product.product_images ?? []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      );
      const attributeValues: Record<string, string> = {};
      for (const row of attributeRows ?? []) {
        attributeValues[(row as { attribute_key: string }).attribute_key] =
          (row as { value: string | null }).value ?? "";
      }

      const productStatus = (product as { status?: string }).status ?? "approved";
      const isDiscontinued = Boolean((product as { is_discontinued?: boolean }).is_discontinued);
      const productCode =
        (product as { product_code?: string }).product_code ??
        (product as { sku?: string | null }).sku ??
        "";
      const inactiveDefinitions = (allAttributeDefinitions ?? []).filter((d) => !d.is_active);
      const rejectionReason = (product as { rejection_reason?: string | null }).rejection_reason ?? null;

      const productWithImages = {
        ...product,
        product_images: images,
        status: productStatus,
      };

      setNode(
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit product</h1>
          <EditProductClientLayout
            productId={id}
            productCode={productCode}
            productStatus={productStatus}
            isDiscontinued={isDiscontinued}
            rejectionReason={rejectionReason}
            product={productWithImages}
            types={types ?? []}
            attributeDefinitions={attributeDefinitions}
            attributeValues={attributeValues}
            inactiveDefinitions={inactiveDefinitions}
          />
        </div>
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      {node === null ? (
        <div className="text-stone-500 text-sm py-12 text-center">Loading…</div>
      ) : (
        node
      )}
    </>
  );
}

export default function EditProductPage() {
  return (
    <Suspense
      fallback={<div className="text-stone-500 text-sm py-12 text-center">Loading…</div>}
    >
      <EditProductPageInner />
    </Suspense>
  );
}
