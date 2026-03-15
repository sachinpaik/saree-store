"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createType(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug =
    (formData.get("slug") as string) ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const bannerUrl = (formData.get("banner_url") as string) || null;
  const sortOrder = parseInt((formData.get("sort_order") as string) || "0", 10);

  const { error } = await supabase.from("types").insert({
    name,
    slug,
    banner_url: bannerUrl,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  revalidatePath("/admin/types");
  return {};
}

export async function updateType(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || "";
  const bannerUrl = (formData.get("banner_url") as string) || null;
  const sortOrder = parseInt((formData.get("sort_order") as string) || "0", 10);

  const { error } = await supabase
    .from("types")
    .update({ name, slug, banner_url: bannerUrl, sort_order: sortOrder })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  revalidatePath("/admin/types");
  revalidatePath(`/kanchipuram-silks`);
  return {};
}

export async function deleteType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("types").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/kanchipuram-silks");
  revalidatePath("/");
  revalidatePath("/admin/types");
  return {};
}
