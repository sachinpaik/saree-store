import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types/database";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as SiteSettings;
}
