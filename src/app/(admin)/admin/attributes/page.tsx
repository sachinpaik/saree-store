import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AttributeDefinitionsManager } from "@/components/admin/AttributeDefinitionsManager";

export default async function AdminAttributesPage() {
  const supabase = await createClient();
  const { data: definitions } = await supabase
    .from("attribute_definitions")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Attribute definitions</h1>
        <Link
          href="/admin/dashboard"
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          ← Dashboard
        </Link>
      </div>
      <p className="text-sm text-stone-600 mb-6">
        These attributes appear on every product add/edit. Inactive attributes are hidden from the product form and product page.
      </p>
      <AttributeDefinitionsManager definitions={(definitions ?? []) as AttributeDefRow[]} />
    </div>
  );
}

export type AttributeDefRow = {
  key: string;
  label: string;
  group: string;
  input_type: string;
  options_json: string | null;
  sort_order: number;
  is_active: boolean;
  is_required: boolean;
};
