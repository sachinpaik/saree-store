import Link from "next/link";
import { getSiteSettings, getStoreSettings } from "storefront";

export async function Footer() {
  const [siteSettings, storeSettings] = await Promise.all([
    getSiteSettings().catch(() => null),
    getStoreSettings().catch(() => null),
  ]);

  const businessName = siteSettings?.business_name
    ? String(siteSettings.business_name)
    : "Saree Store";
  const whatsappNumber = storeSettings?.whatsapp_number ?? null;
  const callNumber = storeSettings?.call_number ?? null;
  const instagramUrl = siteSettings?.instagram_url
    ? String(siteSettings.instagram_url)
    : null;

  const cleanWA = whatsappNumber?.replace(/\D/g, "") ?? null;
  const whatsappHref = cleanWA
    ? `https://wa.me/${cleanWA}?text=${encodeURIComponent("Hi, I'd like to enquire about your saree collection.")}`
    : null;
  const whatsappBulkHref = cleanWA
    ? `https://wa.me/${cleanWA}?text=${encodeURIComponent("Hi, I'm interested in bulk / wholesale ordering. Could you please share your trade pricing and minimum order details?")}`
    : null;
  const callHref = callNumber ? `tel:${callNumber.replace(/\s/g, "")}` : null;

  return (
    <footer className="mt-auto border-t border-rim bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Brand identity */}
        <div className="mb-10">
          <p className="font-serif text-foreground text-xl tracking-wide">
            {businessName}
          </p>
          <p className="text-muted text-sm mt-1">
            Premium Kanchipuram silks, direct from weavers.
          </p>
          <p className="text-muted text-sm">
            Retail &amp; wholesale welcome.
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {/* Collections */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase mb-3">
              Collections
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link
                  href="/kanchipuram-silks"
                  className="hover:text-foreground transition-colors"
                >
                  Kanchipuram Silks
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase mb-3">
              Quick Links
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/information"
                  className="hover:text-foreground transition-colors"
                >
                  Information
                </Link>
              </li>
              {whatsappBulkHref && (
                <li>
                  <a
                    href={whatsappBulkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Bulk Enquiries
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted uppercase mb-3">
              Contact
            </p>
            <ul className="space-y-2.5 text-sm text-muted">
              {callHref && callNumber && (
                <li>
                  <a
                    href={callHref}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <svg
                      className="w-4 h-4 shrink-0 text-muted/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6z"
                      />
                    </svg>
                    {callNumber}
                  </a>
                </li>
              )}
              {whatsappHref && (
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <svg
                      className="w-4 h-4 shrink-0 text-green-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.112 1.523 5.842L.057 23.486a.5.5 0 00.619.61l5.783-1.517A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.798 9.798 0 01-5.015-1.375l-.36-.214-3.732.979.996-3.638-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                    </svg>
                    WhatsApp us
                  </a>
                </li>
              )}
              {instagramUrl && (
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <svg
                      className="w-4 h-4 shrink-0 text-muted/60"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-rim">
          <p className="text-center text-xs text-muted/70">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
