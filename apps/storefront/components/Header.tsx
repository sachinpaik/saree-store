import { getPublicImageUrl, getSiteSettings, getStoreSettings } from "storefront";
import { HeaderInner } from "./HeaderInner";

export async function Header() {
  const [siteSettings, storeSettings] = await Promise.all([
    getSiteSettings().catch(() => null),
    getStoreSettings().catch(() => null),
  ]);

  const businessName = siteSettings?.business_name
    ? String(siteSettings.business_name)
    : "Saree Store";
  const logoKey = siteSettings?.company_logo_key ? String(siteSettings.company_logo_key).trim() : "";
  const logoUrl = logoKey ? getPublicImageUrl(logoKey) : "";

  return (
    <HeaderInner
      businessName={businessName}
      logoUrl={logoUrl || null}
      whatsappNumber={storeSettings?.whatsapp_number ?? null}
      callNumber={storeSettings?.call_number ?? null}
    />
  );
}
