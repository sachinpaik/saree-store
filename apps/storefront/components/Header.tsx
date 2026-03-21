import { getSiteSettings, getStoreSettings } from "storefront";
import { HeaderInner } from "./HeaderInner";

export async function Header() {
  const [siteSettings, storeSettings] = await Promise.all([
    getSiteSettings().catch(() => null),
    getStoreSettings().catch(() => null),
  ]);

  const businessName = siteSettings?.business_name
    ? String(siteSettings.business_name)
    : "Saree Store";

  return (
    <HeaderInner
      businessName={businessName}
      whatsappNumber={storeSettings?.whatsapp_number ?? null}
      callNumber={storeSettings?.call_number ?? null}
    />
  );
}
