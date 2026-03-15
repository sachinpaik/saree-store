import { createClient } from "@/lib/supabase/server";
import type { AttributeDefinition } from "./attribute-definitions-shared";

export type { AttributeDefinition } from "./attribute-definitions-shared";
export { parseSelectOptions } from "./attribute-definitions-shared";

export async function getActiveAttributeDefinitions(): Promise<AttributeDefinition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attribute_definitions")
    .select("key, label, group, input_type, options_json, sort_order, is_active, is_required")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as AttributeDefinition[];
}

/** All definitions including inactive (for "Show inactive attributes" read-only). */
export async function getAllAttributeDefinitions(): Promise<AttributeDefinition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attribute_definitions")
    .select("key, label, group, input_type, options_json, sort_order, is_active, is_required")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as AttributeDefinition[];
}

/** Build label -> value map for product page specs (only non-empty; uses active definitions for labels). */
export async function getProductAttributeSpecs(productId: string): Promise<Record<string, string>> {
  const supabase = await createClient();
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
    const label = keyToLabel[row.attribute_key] ?? row.attribute_key;
    out[label] = v;
  }
  return out;
}

/** Specs for product page: from product_attribute_values, or fallback to product.attributes with definition labels. */
export async function getProductSpecsForDisplay(
  productId: string,
  productAttributes?: Record<string, string | number | boolean> | null
): Promise<Record<string, string>> {
  const fromTable = await getProductAttributeSpecs(productId);
  if (Object.keys(fromTable).length > 0) return fromTable;
  if (!productAttributes || Object.keys(productAttributes).length === 0) return {};
  const defs = await getActiveAttributeDefinitions();
  const keyToLabel = Object.fromEntries(defs.map((d) => [d.key, d.label]));
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(productAttributes)) {
    const v = val === undefined || val === null ? "" : String(val).trim();
    if (!v) continue;
    out[keyToLabel[key] ?? key] = v;
  }
  return out;
}
