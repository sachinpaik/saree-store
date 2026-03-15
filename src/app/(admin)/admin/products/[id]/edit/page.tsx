import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProductClientLayout } from "@/components/admin/EditProductClientLayout";
import { getActiveAttributeDefinitions, getAllAttributeDefinitions } from "@/lib/data/attribute-definitions";
import { getOrCreateDraft } from "@/app/actions/draft-images";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: product, error },
    { data: types },
    attributeDefinitions,
    allAttributeDefinitions,
    { data: attributeRows },
    { data: draftRow },
    draftResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        product_images(id, storage_key, sort_order, alt_text, is_primary, show_on_homepage)
      `)
      .eq("id", id)
      .single(),
    supabase.from("types").select("id, name, slug").order("sort_order", { ascending: true }),
    getActiveAttributeDefinitions().catch(() => []),
    getAllAttributeDefinitions().catch(() => []),
    supabase.from("product_attribute_values").select("attribute_key, value").eq("product_id", id),
    supabase.from("product_drafts").select("status, rejection_reason").eq("product_id", id).maybeSingle(),
    getOrCreateDraft(id),
  ]);

  if (error || !product) notFound();

  const images = (product.product_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  const attributeValues: Record<string, string> = {};
  for (const row of attributeRows ?? []) {
    attributeValues[(row as { attribute_key: string }).attribute_key] = (row as { value: string | null }).value ?? "";
  }

  const productStatus = (product as { status?: string }).status ?? "approved";
  const isDiscontinued = Boolean((product as { is_discontinued?: boolean }).is_discontinued);
  const productCode = (product as { product_code?: string }).product_code ?? (product as { sku?: string | null }).sku ?? "";
  const draftStatusRaw = (draftRow as { status?: string } | null)?.status ?? null;
  const draftStatus = draftStatusRaw === "draft" || draftStatusRaw === "pending" || draftStatusRaw === "approved" || draftStatusRaw === "rejected" ? draftStatusRaw : null;
  const inactiveDefinitions = (allAttributeDefinitions ?? []).filter((d) => !d.is_active);
  const rejectionReason = (product as { rejection_reason?: string | null }).rejection_reason ?? null;
  const draftRejectionReason = (draftRow as { rejection_reason?: string | null } | null)?.rejection_reason ?? null;

  // Use draft data if available, otherwise use live product
  const draft = draftResult.draft;
  const draftImages = draft?.images || [];
  
  console.log("[Edit Page] Draft loaded:", {
    productId: id,
    hasDraft: draftResult.draftExists,
    draftProductFields: draft?.product ? Object.keys(draft.product) : [],
    draftAttributeCount: draft?.attribute_values ? Object.keys(draft.attribute_values).length : 0,
    draftImageCount: draftImages.length,
  });
  
  const productWithImages = {
    ...product,
    product_images: images,
    status: productStatus,
  };

  // Merge draft field values into product (if draft exists with product data)
  let productToEdit = productWithImages;
  if (draft?.product) {
    console.log("[Edit Page] Merging draft product fields into form data");
    productToEdit = {
      ...productWithImages,
      ...draft.product,
    };
  }

  // Merge draft attribute values with live values (draft takes precedence)
  const attributeValuesToEdit = draft?.attribute_values 
    ? { ...attributeValues, ...draft.attribute_values }
    : attributeValues;
  
  console.log("[Edit Page] Attribute values for form:", {
    liveCount: Object.keys(attributeValues).length,
    draftCount: draft?.attribute_values ? Object.keys(draft.attribute_values).length : 0,
    mergedCount: Object.keys(attributeValuesToEdit).length,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit product</h1>
      <EditProductClientLayout
        productId={id}
        productCode={productCode}
        productStatus={productStatus}
        draftStatus={draftStatus}
        isDiscontinued={isDiscontinued}
        rejectionReason={rejectionReason}
        draftRejectionReason={draftRejectionReason}
        product={productToEdit}
        types={types ?? []}
        attributeDefinitions={attributeDefinitions}
        attributeValues={attributeValuesToEdit}
        inactiveDefinitions={inactiveDefinitions}
        draftImages={draftImages}
        draftExists={draftResult.draftExists}
      />
    </div>
  );
}
