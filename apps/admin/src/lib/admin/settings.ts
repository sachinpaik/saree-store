import { createClient } from "@/lib/supabase/client";
import { deleteStorageKeysViaWorker } from "@/lib/storage-worker-client";

export async function updateStoreSettings(formData: FormData) {
  const supabase = createClient();
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
  return {};
}

export async function updateSiteSettings(formData: FormData) {
  const supabase = createClient();
  const rawRotation = formData.get("homepage_rotation_seconds") as string;
  const homepage_rotation_seconds = rawRotation ? parseInt(rawRotation, 10) : null;
  const rawCarouselKeys = formData.get("homepage_carousel_image_keys") as string | null;
  const company_logo_key = ((formData.get("company_logo_key") as string) || "").trim() || null;
  let homepage_carousel_image_keys: string[] = [];
  if (rawCarouselKeys?.trim()) {
    try {
      const parsed = JSON.parse(rawCarouselKeys);
      if (Array.isArray(parsed)) {
        homepage_carousel_image_keys = parsed
          .map((value) => String(value ?? "").trim())
          .filter((value) => value.length > 0);
      }
    } catch {
      return { error: "Invalid homepage carousel images data" };
    }
  }

  const { data: row } = await supabase
    .from("site_settings")
    .select("id, homepage_carousel_image_keys, company_logo_key")
    .limit(1)
    .single();
  if (!row) return { error: "No site settings row" };

  const previousKeys = Array.isArray(row.homepage_carousel_image_keys)
    ? row.homepage_carousel_image_keys
        .map((value: unknown) => String(value ?? "").trim())
        .filter((value: string) => value.length > 0)
    : [];
  const previousLogoKey = row.company_logo_key ? String(row.company_logo_key).trim() : "";

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
      homepage_rotation_seconds: Number.isNaN(homepage_rotation_seconds)
        ? null
        : homepage_rotation_seconds,
      homepage_carousel_image_keys,
      company_logo_key,
    })
    .eq("id", row.id);

  if (error) return { error: error.message };
  const removedKeys = previousKeys.filter((key: string) => !homepage_carousel_image_keys.includes(key));
  if (removedKeys.length > 0) {
    try {
      await deleteStorageKeysViaWorker(removedKeys);
    } catch (deleteErr) {
      console.warn("Failed to delete removed homepage carousel images:", deleteErr);
    }
  }
  if (previousLogoKey && previousLogoKey !== company_logo_key) {
    try {
      await deleteStorageKeysViaWorker([previousLogoKey]);
    } catch (deleteErr) {
      console.warn("Failed to delete removed company logo:", deleteErr);
    }
  }
  return {};
}
