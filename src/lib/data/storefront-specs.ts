import { createStorefrontClient } from "@/lib/supabase/storefront";

/**
 * Product specs for storefront detail page only. Uses cookie-less client
 * so the page can be statically generated at build time. Does not touch
 * cookies() or request context.
 */
export async function getProductSpecsForDisplayForStorefront(
  productId: string,
  productAttributes?: Record<string, string | number | boolean> | null
): Promise<Record<string, string>> {
  const supabase = createStorefrontClient();

  const [defsRes, valuesRes] = await Promise.all([
    supabase.from("attribute_definitions").select("key, label").eq("is_active", true),
    supabase.from("product_attribute_values").select("attribute_key, value").eq("product_id", productId),
  ]);

  const defs = (defsRes.data ?? []) as { key: string; label: string }[];
  const values = (valuesRes.data ?? []) as { attribute_key: string; value: string | null }[];
  const keyToLabel = Object.fromEntries(defs.map((d) => [d.key, d.label]));

  const out: Record<string, string> = {};
  for (const row of values) {
    const v = row.value?.trim();
    if (!v) continue;
    out[keyToLabel[row.attribute_key] ?? row.attribute_key] = v;
  }

  if (Object.keys(out).length > 0) return out;
  if (!productAttributes || Object.keys(productAttributes).length === 0) return {};

  for (const [key, val] of Object.entries(productAttributes)) {
    const v = val === undefined || val === null ? "" : String(val).trim();
    if (!v) continue;
    out[keyToLabel[key] ?? key] = v;
  }
  return out;
}
