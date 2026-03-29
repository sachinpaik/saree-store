import Link from "next/link";
import { getSiteSettings, getStoreSettings } from "@/storefront";

export const metadata = {
  title: "Information",
  description: "Wholesale, authenticity, care, FAQ, and contact details for our silk sarees.",
};

function buildWhatsAppHref(number: string | null | undefined, message: string) {
  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  return clean ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}` : null;
}

function buildCallHref(number: string | null | undefined) {
  if (!number) return null;
  const clean = number.replace(/\s/g, "");
  return clean ? `tel:${clean}` : null;
}

const wholesaleTerms = [
  {
    title: "Minimum order",
    body: "Around 10 pieces. Mixed designs are possible, so you do not need to repeat the same style.",
    stat: "10+",
    statTitle: "Minimum order quantity",
    statBody: "Mixed designs welcome for boutique and reseller buying.",
  },
  {
    title: "Lead time",
    body: "Usually 3–7 business days depending on quantity, product type, and current stock readiness.",
    stat: "3-7",
    statTitle: "Business days lead time",
    statBody: "Faster for ready stock, slightly longer for curated or bulk selections.",
  },
  {
    title: "Direct sourcing",
    body: "Closer to the weaving source means fewer layers in pricing and better clarity on quality.",
    stat: "0",
    statTitle: "Middlemen",
    statBody: "A more direct route from weavers to buyers and boutiques.",
  },
];

const infoCards = [
  {
    eyebrow: "Our selection",
    title: "About our sarees",
    body: "A focused selection of Kanchipuram and silk sarees chosen for weave, colour, and finishing quality. Every piece is handpicked closer to the source, not pulled from a generic warehouse catalogue.",
  },
  {
    eyebrow: "Verified at source",
    title: "Authenticity",
    body: "Wherever stated, Kanchipuram pieces are represented with genuine silk and zari details as described. You can always ask for more photos, drape videos, or closer shots before purchase.",
  },
  {
    eyebrow: "Maintaining your saree",
    title: "Care instructions",
    body: "Dry clean is recommended. Store folded with a soft cloth between layers, keep away from direct sunlight, and refold every few weeks to avoid long crease lines settling in the same place.",
  },
];

const faqItems = [
  {
    question: "Do you ship internationally?",
    answer:
      "Yes. UAE and India are the easiest markets for us to support, and we can also guide international shipments depending on destination. Share your country or city on WhatsApp and we will confirm timelines and the best route.",
  },
  {
    question: "What is the minimum order for bulk?",
    answer:
      "Our indicative wholesale minimum is around 10 pieces. Mixed designs are usually possible, so you can build a more useful boutique assortment instead of repeating only one style.",
  },
  {
    question: "Can I get more photos or a video before buying?",
    answer:
      "Absolutely. We encourage that. Send the product link, title, or SKU on WhatsApp and we can share additional close-ups, zari detail, and drape videos where available so you can evaluate with confidence.",
  },
  {
    question: "What is your return or exchange policy?",
    answer:
      "We handle each case individually, especially because many sarees are unique or limited. If something arrives with a clear issue or differs materially from what was shown, contact us promptly with photos so we can review and support the next step.",
  },
  {
    question: "How do I verify the silk is genuine?",
    answer:
      "Ask us for additional photos, videos, and any available sourcing details for the exact piece you are considering. We are happy to show more of the weave, zari, border, and texture so you can assess authenticity before confirming the order.",
  },
];

export default async function InformationPage() {
  const [siteSettings, storeSettings] = await Promise.all([
    getSiteSettings().catch(() => null),
    getStoreSettings().catch(() => null),
  ]);

  const whatsappNumber = storeSettings?.whatsapp_number ?? null;
  const callNumber = storeSettings?.call_number ?? null;
  const contactEmail =
    (siteSettings && typeof siteSettings.contact_email === "string" ? siteSettings.contact_email : null) ?? null;
  const supportHours =
    (siteSettings && typeof siteSettings.support_hours === "string" ? siteSettings.support_hours : null) ??
    "Mon-Sat, 10am-7pm (IST)";

  const whatsappHref = buildWhatsAppHref(
    whatsappNumber,
    "Hi, I have a question about your saree collection."
  );
  const whatsappBulkHref = buildWhatsAppHref(
    whatsappNumber,
    "Hi, I'm interested in wholesale or bulk saree orders. Please share pricing and minimum order details."
  );
  const callHref = buildCallHref(callNumber);

  return (
    <div className="bg-[#faf7f2] text-[#1a1008]">
      <section className="bg-[#1a1008]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-18">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-[#e8c96e]">
            Wholesale · Authenticity · Care · FAQ · Contact
          </p>
          <h1 className="max-w-3xl font-serif text-[2.8rem] leading-[1.02] text-[#faf7f2] md:text-[4rem]">
            Everything you need to know
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45 md:text-[15px]">
            From wholesale bulk orders to saree care, authenticity guidance to shipping support,
            this page covers the details customers usually want before placing an order.
          </p>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6 md:py-18">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#c9962a]">
            For boutiques and resellers
          </p>
          <h2 className="font-serif text-[2.2rem] leading-[1.05] text-[#1a1008] md:text-[2.8rem]">
            Wholesale and bulk enquiries
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[3px] bg-[#1a1008] px-6 py-8 md:px-10 md:py-10">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#e8c96e]">
                Wholesale programme
              </p>
              <h3 className="max-w-lg font-serif text-[2rem] leading-[1.15] text-[#faf7f2]">
                Direct pricing for boutiques, resellers, and organisers
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
                We work with buyers who need multiple sarees at once. Share your approximate
                quantity, preferred colours, and target styles on WhatsApp and we will suggest
                options from current stock and upcoming pieces.
              </p>

              <div className="mt-8 space-y-4">
                {wholesaleTerms.map((term) => (
                  <div key={term.title} className="flex gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9962a]/30 bg-[#c9962a]/15 text-[#e8c96e]">
                      <span className="text-[11px]">+</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{term.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/52">{term.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {whatsappBulkHref ? (
                <a
                  href={whatsappBulkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center rounded-sm bg-[#25d366] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white"
                >
                  WhatsApp for wholesale pricing
                </a>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              {wholesaleTerms.map((term) => (
                <div
                  key={term.statTitle}
                  className="relative rounded-[3px] border border-[#1a1008]/10 bg-white px-6 py-6"
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-[#c9962a]" />
                  <p className="font-serif text-[2.4rem] italic leading-none text-[#c9962a]">
                    {term.stat}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#1a1008]">{term.statTitle}</p>
                  <p className="mt-1 text-[12px] leading-6 text-[#1a1008]/50">{term.statBody}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid border-y border-[#1a1008]/10 bg-white md:grid-cols-3">
        {infoCards.map((card, index) => (
          <div
            key={card.title}
            className={`px-6 py-10 md:px-10 ${index !== infoCards.length - 1 ? "md:border-r md:border-[#1a1008]/10" : ""}`}
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#f5edd8] text-[#c9962a]">
              <span className="text-sm">{index + 1}</span>
            </div>
            <p className="mb-2 text-[9px] uppercase tracking-[0.16em] text-[#c9962a]">{card.eyebrow}</p>
            <h3 className="font-serif text-[1.65rem] leading-[1.1] text-[#1a1008]">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#1a1008]/52">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="px-4 py-14 md:px-6 md:py-18">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#c9962a]">
              Got questions?
            </p>
            <h2 className="font-serif text-[2.2rem] leading-[1.05] text-[#1a1008] md:text-[2.8rem]">
              Frequently asked
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#1a1008]/50">
              If you do not find the answer here, send us a message on WhatsApp and we will help
              with the exact product, delivery region, or bulk requirement you have in mind.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center rounded-sm bg-[#25d366] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white"
              >
                Ask on WhatsApp
              </a>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[3px] border border-[#1a1008]/10 bg-white">
            {faqItems.map((item, index) => (
              <details
                key={item.question}
                className={`${index !== faqItems.length - 1 ? "border-b border-[#1a1008]/10" : ""} group`}
                open={index < 2}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-medium leading-6 text-[#1a1008]">{item.question}</span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#1a1008]/10 text-[#c9962a] transition-transform group-open:rotate-180">
                    <span className="text-[10px]">▼</span>
                  </span>
                </summary>
                <p className="px-6 pb-5 pr-10 text-sm leading-7 text-[#1a1008]/52">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0e3d2b] px-4 py-14 md:px-6 md:py-18">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#e8c96e]/65">
              Reach out directly
            </p>
            <h2 className="max-w-lg font-serif text-[2.2rem] leading-[1.08] text-white md:text-[2.9rem]">
              Need help choosing the right saree or planning a bulk order?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/45">
              We can help with pricing, availability, extra photos, delivery guidance, and wholesale
              coordination for UAE, India, and selected international destinations.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center rounded-sm bg-[#25d366] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white"
              >
                WhatsApp us
              </a>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {whatsappNumber ? (
              <div className="rounded-[3px] border border-white/12 bg-white/7 px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/40">WhatsApp</p>
                <p className="mt-1 text-base font-medium text-white">{whatsappNumber}</p>
                <p className="mt-1 text-[11px] text-white/40">Best for product photos, videos, and quick replies</p>
              </div>
            ) : null}
            {callNumber ? (
              <div className="rounded-[3px] border border-white/12 bg-white/7 px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/40">Phone</p>
                <p className="mt-1 text-base font-medium text-white">{callNumber}</p>
                <p className="mt-1 text-[11px] text-white/40">Call for direct conversation and faster clarification</p>
              </div>
            ) : null}
            {contactEmail ? (
              <div className="rounded-[3px] border border-white/12 bg-white/7 px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/40">Email</p>
                <a href={`mailto:${contactEmail}`} className="mt-1 block text-base font-medium text-white">
                  {contactEmail}
                </a>
                <p className="mt-1 text-[11px] text-white/40">Useful for trade communication and detailed requests</p>
              </div>
            ) : null}
            {supportHours ? (
              <div className="rounded-[3px] border border-white/12 bg-white/7 px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/40">Support hours</p>
                <p className="mt-1 text-base font-medium text-white">{supportHours}</p>
                <p className="mt-1 text-[11px] text-white/40">Response timing may vary slightly for international time zones</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-sm bg-[#25d366] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white"
                >
                  WhatsApp us
                </a>
              ) : null}
              {callHref ? (
                <a
                  href={callHref}
                  className="inline-flex items-center rounded-sm border border-white/18 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-white"
                >
                  Call us
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl text-sm text-[#1a1008]/52">
          For a specific saree, visit the{" "}
          <Link href="/kanchipuram-silks" className="underline underline-offset-2 text-[#1a1008]">
            Kanchipuram Silks
          </Link>{" "}
          collection and use the product-level enquiry action for the fastest response.
        </div>
      </section>
    </div>
  );
}
