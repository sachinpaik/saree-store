import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [
    { count: productsCount },
    { count: typesCount },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("types").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="p-6 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition"
        >
          <h2 className="font-medium text-stone-900">Products</h2>
          <p className="text-2xl font-light text-stone-600 mt-1">{productsCount ?? 0}</p>
        </Link>
        <Link
          href="/admin/types"
          className="p-6 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition"
        >
          <h2 className="font-medium text-stone-900">Types</h2>
          <p className="text-2xl font-light text-stone-600 mt-1">{typesCount ?? 0}</p>
        </Link>
        <Link
          href="/admin/attributes"
          className="p-6 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition"
        >
          <h2 className="font-medium text-stone-900">Attribute definitions</h2>
          <p className="text-sm text-stone-500 mt-1">Product specs & form fields</p>
        </Link>
        <Link
          href="/admin/settings"
          className="p-6 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition"
        >
          <h2 className="font-medium text-stone-900">Settings</h2>
          <p className="text-sm text-stone-500 mt-1">Store & site settings</p>
        </Link>
      </div>
    </div>
  );
}
