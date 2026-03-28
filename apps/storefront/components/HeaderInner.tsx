"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/kanchipuram-silks", label: "Kanchipuram Silks" },
  { href: "/about", label: "Silk Manufacturing" },
  { href: "/information", label: "Info" },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.112 1.523 5.842L.057 23.486a.5.5 0 00.619.61l5.783-1.517A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.798 9.798 0 01-5.015-1.375l-.36-.214-3.732.979.996-3.638-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

export function HeaderInner({
  businessName,
  logoUrl,
  whatsappNumber,
  callNumber,
}: {
  businessName: string;
  logoUrl: string | null;
  whatsappNumber: string | null;
  callNumber: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileMenuId = "mobile-nav-menu";

  const cleanWA = whatsappNumber?.replace(/\D/g, "") ?? null;
  const whatsappHref = cleanWA
    ? `https://wa.me/${cleanWA}?text=${encodeURIComponent("Hi, I'd like to enquire about your saree collection.")}`
    : null;
  const callHref = callNumber ? `tel:${callNumber.replace(/\s/g, "")}` : null;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-rim bg-surface/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="min-w-0 flex-1 md:flex-none flex items-center gap-2 text-foreground truncate"
        >
          {logoUrl ? (
            <span className="relative h-8 w-8 shrink-0 rounded-sm overflow-hidden border border-rim bg-white">
              <Image src={logoUrl} alt={businessName} fill className="object-contain" sizes="32px" unoptimized />
            </span>
          ) : null}
          <span className="font-serif text-xl tracking-wide truncate">{businessName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm tracking-wide">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`pb-0.5 border-b-2 transition-colors ${
                  isActive
                    ? "text-foreground border-foreground"
                    : "text-muted border-transparent hover:text-foreground hover:border-rim"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp us"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          {callHref && (
            <a
              href={callHref}
              aria-label="Call us"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-rim text-muted text-xs font-medium hover:bg-background transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
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
              Call
            </a>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={mobileMenuId}
            className="md:hidden p-2 rounded-sm text-muted hover:bg-background transition-colors"
          >
            {menuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-rim bg-surface shadow-sm">
          <nav id={mobileMenuId} className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 text-sm border-b border-rim last:border-0 transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            {callHref && (
              <a
                href={callHref}
                className="py-3 text-sm text-muted hover:text-foreground flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
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
                Call us
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
