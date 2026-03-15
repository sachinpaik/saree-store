import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { getSiteSettings } from "@/lib/data/site-settings";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [storeResult, siteSettings] = await Promise.all([
    supabase.from("store_settings").select("*").limit(1).single(),
    getSiteSettings().catch(() => null),
  ]);
  const settings = storeResult.data;

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">Store Settings</h1>
        <SettingsForm
          settings={{
            whatsapp_number: settings?.whatsapp_number ?? "",
            call_number: settings?.call_number ?? "",
            whatsapp_message_template: settings?.whatsapp_message_template ?? "",
          }}
        />
      </section>
      <section>
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Site / Contact Settings</h2>
        <SiteSettingsForm
          settings={{
            business_name: siteSettings?.business_name ?? "",
            contact_phone: siteSettings?.contact_phone ?? "",
            contact_whatsapp: siteSettings?.contact_whatsapp ?? "",
            contact_email: siteSettings?.contact_email ?? "",
            address_text: siteSettings?.address_text ?? "",
            instagram_url: siteSettings?.instagram_url ?? "",
            support_hours: siteSettings?.support_hours ?? "",
            homepage_rotation_seconds: siteSettings?.homepage_rotation_seconds != null ? String(siteSettings.homepage_rotation_seconds) : "",
          }}
        />
      </section>
    </div>
  );
}
