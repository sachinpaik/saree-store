import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TypeForm } from "@/components/admin/TypeForm";

export default async function EditTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: type, error } = await supabase
    .from("types")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !type) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit type</h1>
      <TypeForm type={type} />
    </div>
  );
}
