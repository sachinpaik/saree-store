import Image from "next/image";
import { AboutVideoPlayer } from "../components/AboutVideoPlayer";
import { getPublicImageUrl } from "../../data/storefront.service";
import type { AboutContent, AboutVideo, StoreSettings } from "../../domain/types/storefront.types";

function toPublicUrl(storageKey: string | null | undefined): string | null {
  if (!storageKey) return null;
  const key = storageKey.trim();
  if (!key) return null;
  return getPublicImageUrl(key) || null;
}

function mapVideoSources(video: AboutVideo) {
  return {
    "360p": toPublicUrl(video.video_360_key) ?? undefined,
    "720p": toPublicUrl(video.video_720_key) ?? undefined,
    "1080p": toPublicUrl(video.video_1080_key) ?? undefined,
  };
}

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

const processSteps = [
  { number: "01", title: "Silk sourcing", subtitle: "Pure mulberry silk threads" },
  { number: "02", title: "Zari preparation", subtitle: "Gold and silver thread finishing" },
  { number: "03", title: "Loom setting", subtitle: "Traditional pit loom setup" },
  { number: "04", title: "Handweaving", subtitle: "Days of skilled craftsmanship" },
  { number: "05", title: "Finishing checks", subtitle: "Texture, fall, and border review" },
];

const authenticityPillars = [
  {
    title: "From weaver to buyer",
    body: "No middlemen involved. The sourcing stays closer to the looms, giving better confidence in quality and value.",
  },
  {
    title: "Handpicked silk collections",
    body: "Traditional Kanchipuram detail is balanced with colours and motifs that work for both occasion and boutique buyers.",
  },
  {
    title: "Craft-led quality control",
    body: "We focus on weave clarity, zari feel, border finish, and drape so each saree feels right beyond the photograph.",
  },
  {
    title: "UAE and India access",
    body: "Customers can explore premium sarees with direct guidance, faster enquiry flow, and local delivery support across both markets.",
  },
];

export function AboutPage({
  content,
  videos,
  settings,
}: {
  content: AboutContent | null;
  videos: AboutVideo[];
  settings: StoreSettings | null;
}) {
  const featured = videos[0] ?? null;
  const rest = videos.slice(1);
  const galleryThumbs = videos
    .map((video) => toPublicUrl(video.thumbnail_key))
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  const whatsappHref = buildWhatsAppHref(
    settings?.whatsapp_number,
    "Hi, I would like to know more about your silk manufacturing process and saree collection."
  );
  const callHref = buildCallHref(settings?.call_number);
  const heroTitle = content?.title?.trim() || "Silk Manufacturing";
  const introText =
    content?.intro_text?.trim() ||
    "A closer look at the silk, zari, loom preparation, and hand-finishing details behind every premium saree.";

  return (
    <div className="bg-[#faf7f2] text-[#1a1008]">
      <section className="border-b border-[#2c1a11] bg-[#1a1008]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-20 lg:gap-20">
          <div className="relative z-[1] max-w-xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-[#e8c96e]">
              The craft behind every saree
            </p>
            <h1 className="font-serif text-[2.8rem] leading-[0.98] text-[#faf7f2] md:text-[4.1rem]">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/62 md:text-[15px]">
              {introText}
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-sm bg-[#c9962a] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#1a1008] transition-colors hover:bg-[#ddb255]"
              >
                Enquire via WhatsApp
              </a>
            ) : null}
          </div>

          <div className="grid min-h-[260px] grid-cols-2 gap-3 md:min-h-[360px]">
            {galleryThumbs[0] ? (
              <div className="relative row-span-2 overflow-hidden rounded-[3px]">
                <Image
                  src={galleryThumbs[0]}
                  alt="Silk weaving close-up"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            ) : (
              <div className="row-span-2 rounded-[3px] bg-[linear-gradient(180deg,#6a1616,#3f0909)]" />
            )}
            {galleryThumbs[1] ? (
              <div className="relative overflow-hidden rounded-[3px]">
                <Image
                  src={galleryThumbs[1]}
                  alt="Silk motif detail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 20vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            ) : (
              <div className="rounded-[3px] bg-[#c9962a]" />
            )}
            {galleryThumbs[2] ? (
              <div className="relative overflow-hidden rounded-[3px]">
                <Image
                  src={galleryThumbs[2]}
                  alt="Loom process detail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 20vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            ) : (
              <div className="rounded-[3px] bg-[#204560]" />
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-[#c9962a]/25 bg-[#f5edd8]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#c9962a]/20 px-4 md:grid-cols-5 md:divide-x md:divide-y-0 md:px-6">
          {processSteps.map((step) => (
            <div key={step.number} className="flex items-center gap-4 px-0 py-5 md:px-5">
              <p className="font-serif text-[2rem] italic leading-none text-[#c9962a]">{step.number}</p>
              <div>
                <p className="text-sm font-medium text-[#1a1008]">{step.title}</p>
                <p className="mt-1 text-[11px] text-[#1a1008]/50">{step.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-14 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-20 lg:gap-20">
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#c9962a]">What makes it authentic</p>
          <h2 className="max-w-lg font-serif text-[2.3rem] leading-[1.05] text-[#1a1008] md:text-[3rem]">
            The art and quality behind premium silk
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#1a1008]/60">
            Premium silk sarees are shaped by fabric purity, weaving technique, zari feel, and the discipline of the loom.
            Kanchipuram tradition stands out because every stage still depends on skilled human judgement, not shortcuts.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#1a1008]/60">
            The result is not just a garment, but a textile with weight, depth, and cultural value. Whether a saree is chosen
            for a wedding, boutique stock, or a collector purchase, the craft story matters as much as the final look.
          </p>
          {content?.body_html?.trim() ? (
            <div
              className="prose prose-stone mt-6 max-w-none prose-headings:font-serif prose-p:text-[#1a1008]/60 prose-li:text-[#1a1008]/60"
              dangerouslySetInnerHTML={{ __html: content.body_html }}
            />
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[3px] border border-[#1a1008]/10 bg-white">
          {authenticityPillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className={`flex gap-4 px-5 py-5 ${index !== authenticityPillars.length - 1 ? "border-b border-[#1a1008]/10" : ""}`}
            >
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5edd8] text-[#c9962a]">
                <span className="text-sm">{index + 1}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1008]">{pillar.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#1a1008]/55">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#c9962a]">Craft in motion</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.05] text-[#1a1008] md:text-[2.8rem]">
                Silk manufacturing videos
              </h2>
            </div>
            <p className="text-sm text-[#1a1008]/50">Tap a thumbnail to load and play the video.</p>
          </div>

          {featured ? (
            <div className="space-y-6">
              <div className="grid overflow-hidden rounded-[3px] border border-[#1a1008]/10 bg-[#faf7f2] md:grid-cols-2">
                <div className="min-w-0">
                  <AboutVideoPlayer
                    title={featured.title}
                    description={featured.description}
                    poster={toPublicUrl(featured.thumbnail_key)}
                    sources={mapVideoSources(featured)}
                  />
                </div>
                <div className="flex flex-col justify-center px-6 py-8 md:px-8">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#c9962a]">Featured video</p>
                  <h3 className="font-serif text-[2rem] leading-[1.1] text-[#1a1008]">
                    {featured.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#1a1008]/55">
                    {featured.description || "See a closer look at loom preparation, weaving rhythm, and the finishing details that shape each saree."}
                  </p>
                </div>
              </div>

              {rest.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {rest.map((video) => (
                    <AboutVideoPlayer
                      key={video.id}
                      title={video.title}
                      description={video.description}
                      poster={toPublicUrl(video.thumbnail_key)}
                      sources={mapVideoSources(video)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-[3px] border border-[#1a1008]/10 bg-[#faf7f2] p-5 text-sm text-[#1a1008]/55">
              Videos will appear here once they are added in admin.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#c9962a] px-4 py-12 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-2xl font-serif text-[2.2rem] leading-[1.1] text-[#1a1008] md:text-[3rem]">
            Want to understand the process before choosing your saree?
          </h2>
          <div className="flex flex-wrap gap-3">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-sm bg-[#1a1008] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#faf7f2]"
              >
                WhatsApp us
              </a>
            ) : null}
            {callHref ? (
              <a
                href={callHref}
                className="inline-flex items-center rounded-sm border border-[#1a1008]/25 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#1a1008]"
              >
                Call us
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
