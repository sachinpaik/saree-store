import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteTypeButton } from "@/components/admin/DeleteTypeButton";

export default async function AdminTypesPage() {
  const supabase = await createClient();
  const { data: types } = await supabase
    .from("types")
    .select("id, slug, name, banner_url, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Types</h1>
        <Link
          href="/admin/types/new"
          className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800"
        >
          Add type
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Slug</th>
              <th className="text-left p-3 font-medium">Order</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types?.map((t) => (
              <tr key={t.id} className="border-b border-stone-100">
                <td className="p-3 font-medium text-stone-900">{t.name}</td>
                <td className="p-3 text-stone-600">{t.slug}</td>
                <td className="p-3 text-stone-600">{t.sort_order}</td>
                <td className="p-3 text-right">
                  <span className="inline-flex gap-3 justify-end">
                  <Link
                    href={`/admin/types/${t.id}/edit`}
                    className="text-stone-600 hover:text-stone-900"
                  >
                    Edit
                  </Link>
                  <DeleteTypeButton typeId={t.id} typeName={t.name} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!types || types.length === 0) && (
          <p className="p-8 text-center text-stone-500">No types yet.</p>
        )}
      </div>
    </div>
  );
}
