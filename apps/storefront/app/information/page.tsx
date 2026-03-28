import Link from "next/link";
import { getSiteSettings, getStoreSettings } from "storefront";

export const metadata = {
  title: "Information",
  description: "Quick ways to enquire about our Kanchipuram and silk sarees.",
};

export default async function InformationPage() {
  const [siteSettings, storeSettings] = await Promise.all([
    getSiteSettings().catch(() => null),
    getStoreSettings().catch(() => null),
  ]);

  const whatsappNumber = storeSettings?.whatsapp_number ?? null;
  const callNumber = storeSettings?.call_number ?? null;
  const contactEmail =
    (siteSettings && typeof siteSettings["contact_email"] === "string"
      ? (siteSettings["contact_email"] as string)
      : null) ?? null;
  const supportHours =
    (siteSettings && typeof siteSettings["support_hours"] === "string"
      ? (siteSettings["support_hours"] as string)
      : null) ?? "Mon–Sat, 10am–7pm (IST)";

  const cleanWA = whatsappNumber?.replace(/\D/g, "") ?? null;
  const whatsappHref = cleanWA
    ? `https://wa.me/${cleanWA}?text=${encodeURIComponent(
        "Hi, I have a question about your sarees."
      )}`
    : null;
  const whatsappBulkHref = cleanWA
    ? `https://wa.me/${cleanWA}?text=${encodeURIComponent(
        "Hi, I'm interested in wholesale / bulk saree orders. Please share trade pricing and minimum order details."
      )}`
    : null;
  const callHref = callNumber ? `tel:${callNumber.replace(/\s/g, "")}` : null;

  return (
    <div className="py-10 md:py-14">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Enquiry hub */}
        <section className="space-y-4">
          <header className="space-y-1">
            <h1 className="font-serif text-2xl md:text-3xl text-foreground tracking-wide">
              Have a question about a saree?
            </h1>
            <p className="text-sm text-muted max-w-xl">
              The easiest way to enquire is over WhatsApp. Share a screenshot or link to the saree,
              and we will help with availability, more photos and order details.
            </p>
          </header>

          {whatsappHref && (
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-sm hover:bg-green-700"
              >
                WhatsApp us
              </a>
              {whatsappBulkHref && (
                <a
                  href={whatsappBulkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center px-4 py-2.5 text-sm font-medium border border-rim text-foreground rounded-sm hover:bg-surface"
                >
                  WhatsApp — wholesale / bulk
                </a>
              )}
            </div>
          )}

          <p className="text-[13px] text-muted">
            For a specific saree, open its page from the{" "}
            <Link href="/kanchipuram-silks" className="underline underline-offset-2">
              Kanchipuram Silks
            </Link>{" "}
            collection and use the WhatsApp button shown there.
          </p>
        </section>

        {/* Wholesale & Bulk Buyers – compact card (no separate button) */}
        <section className="space-y-3">
          <div className="border border-rim rounded-sm bg-surface/70 px-4 py-4 md:px-5 md:py-5 text-sm text-muted space-y-2">
            <h2 className="text-sm font-medium text-foreground tracking-[0.16em] uppercase">
              Wholesale &amp; bulk enquiries
            </h2>
            <p>
              We work with boutiques, resellers and organisers who need multiple sarees at once.
              Share your approximate quantity and styles on WhatsApp, and we will suggest options
              from current stock and upcoming pieces.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Indicative minimum: around 10 pieces (mixed designs possible)</li>
              <li>Typical lead time: 3–7 business days depending on quantity</li>
              <li>Payment via bank transfer / UPI / supported international options</li>
            </ul>
            {whatsappBulkHref && (
              <a
                href={whatsappBulkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center mt-4 px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-sm hover:bg-green-700"
              >
                WhatsApp for wholesale pricing
              </a>
            )}
          </div>
        </section>

        {/* Brief info blocks */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
              About our sarees
            </h3>
            <p>
              A focused selection of Kanchipuram and silk sarees, chosen for weave, colour and
              finishing quality.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
              Authenticity
            </h3>
            <p>
              Wherever stated, Kanchipuram pieces use genuine silk and zari work as described. You
              can always ask for more photos or videos.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
              Care
            </h3>
            <p>
              Dry clean recommended. Store folded with a soft cloth between layers, away from direct
              sunlight.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground tracking-[0.16em] uppercase">
            Frequently asked questions
          </h2>
          <div className="border border-rim rounded-sm bg-surface/70 divide-y divide-rim text-sm text-muted">
            <details className="group px-4 py-3">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden font-medium text-foreground flex justify-between items-center gap-2">
                Do you ship internationally?
                <span className="text-muted group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="mt-2 pr-6">
                We ship within India and to select international destinations. Share your city or country on WhatsApp and we will confirm options and timelines.
              </p>
            </details>
            <details className="group px-4 py-3">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden font-medium text-foreground flex justify-between items-center gap-2">
                What is the minimum order for bulk?
                <span className="text-muted group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="mt-2 pr-6">
                We typically work from around 10 pieces (mixed designs possible). Exact terms depend on stock and styles — message us with your requirement.
              </p>
            </details>
            <details className="group px-4 py-3">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden font-medium text-foreground flex justify-between items-center gap-2">
                Can I get more photos or a video before buying?
                <span className="text-muted group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="mt-2 pr-6">
                Yes. WhatsApp us with the product link or SKU and we will share additional photos or a short video where available.
              </p>
            </details>
            <details className="group px-4 py-3">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden font-medium text-foreground flex justify-between items-center gap-2">
                What is your return or exchange policy?
                <span className="text-muted group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="mt-2 pr-6">
                Because each saree is often unique, returns are handled case by case. Ask on WhatsApp before ordering if you need clarity for your situation.
              </p>
            </details>
          </div>
        </section>

        {/* Contact tile */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground tracking-[0.16em] uppercase">
            Contact details
          </h2>
          <div className="border border-rim rounded-sm bg-surface/70 px-4 py-4 md:px-5 md:py-5 text-sm text-muted space-y-2">
            {whatsappNumber && (
              <p className="flex items-center gap-2">
                <span className="text-green-600">📱</span>
                <span>
                  WhatsApp: <span className="text-foreground font-medium">{whatsappNumber}</span>
                </span>
              </p>
            )}
            {callNumber && (
              <p className="flex items-center gap-2">
                <span>📞</span>
                <span>
                  Phone: <span className="text-foreground font-medium">{callNumber}</span>
                </span>
              </p>
            )}
            {contactEmail && (
              <p className="flex items-center gap-2">
                <span>✉️</span>
                <span>
                  Email:{" "}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-foreground underline underline-offset-2"
                  >
                    {contactEmail}
                  </a>
                </span>
              </p>
            )}
            {supportHours && (
              <p className="flex items-center gap-2">
                <span>🕐</span>
                <span>
                  Hours: <span className="text-foreground font-medium">{supportHours}</span>
                </span>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
