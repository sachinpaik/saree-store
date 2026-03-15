"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateStoreSettings(formData: FormData) {
  const supabase = await createClient();
  const whatsappNumber = (formData.get("whatsapp_number") as string) || null;
  const callNumber = (formData.get("call_number") as string) || null;
  const whatsappMessageTemplate = (formData.get("whatsapp_message_template") as string) || null;

  const { data: row } = await supabase.from("store_settings").select("id").limit(1).single();
  if (!row) return { error: "No settings row" };

  const { error } = await supabase
    .from("store_settings")
    .update({
      whatsapp_number: whatsappNumber,
      call_number: callNumber,
      whatsapp_message_template: whatsappMessageTemplate,
    })
    .eq("id", row.id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/saree/[slug]");
  return {};
}

export async function updateSiteSettings(formData: FormData) {
  const supabase = await createClient();
  const rawRotation = formData.get("homepage_rotation_seconds") as string;
  const homepage_rotation_seconds = rawRotation ? parseInt(rawRotation, 10) : null;

  const { data: row } = await supabase.from("site_settings").select("id").limit(1).single();
  if (!row) return { error: "No site settings row" };

  const { error } = await supabase
    .from("site_settings")
    .update({
      business_name: (formData.get("business_name") as string) || null,
      contact_phone: (formData.get("contact_phone") as string) || null,
      contact_whatsapp: (formData.get("contact_whatsapp") as string) || null,
      contact_email: (formData.get("contact_email") as string) || null,
      address_text: (formData.get("address_text") as string) || null,
      instagram_url: (formData.get("instagram_url") as string) || null,
      support_hours: (formData.get("support_hours") as string) || null,
      homepage_rotation_seconds: Number.isNaN(homepage_rotation_seconds) ? null : homepage_rotation_seconds,
    })
    .eq("id", row.id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/contact");
  return {};
}
