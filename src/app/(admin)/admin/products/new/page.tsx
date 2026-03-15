import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { getActiveAttributeDefinitions } from "@/lib/data/attribute-definitions";

export default async function NewProductPage() {
  const supabase = await createClient();
  const [types, attributeDefinitions] = await Promise.all([
    supabase.from("types").select("id, name, slug").order("sort_order", { ascending: true }),
    getActiveAttributeDefinitions().catch(() => []),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">New product</h1>
      <ProductForm
        types={types?.data ?? []}
        attributeDefinitions={attributeDefinitions}
        attributeValues={{}}
      />
    </div>
  );
}
