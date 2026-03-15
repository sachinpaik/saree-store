"use server";

import { getProductSpecsForDisplay } from "@/lib/data/attribute-definitions";

/** Server action for client to fetch product specs (e.g. when showing draft on detail page). */
export async function getProductSpecsForDisplayAction(
  productId: string,
  productAttributes?: Record<string, string | number | boolean> | null
): Promise<Record<string, string>> {
  return getProductSpecsForDisplay(productId, productAttributes);
}
