import { AboutVideoPlayer } from "../components/AboutVideoPlayer";
import { getPublicImageUrl } from "../services/storefront.service";
import type { AboutContent, AboutVideo } from "../types/storefront.types";

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

export function AboutPage({
  content,
  videos,
}: {
  content: AboutContent | null;
  videos: AboutVideo[];
}) {
  const featured = videos[0] ?? null;
  const rest = videos.slice(1);

  return (
    <div className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <header className="space-y-3 max-w-3xl">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            {content?.title?.trim() || "Silk Manufacturing"}
          </h1>
          <p className="text-sm md:text-base text-muted">
            {content?.intro_text?.trim() ||
              "Discover the craftsmanship, weaving process, and finishing steps behind our silk sarees."}
          </p>
        </header>

        {content?.body_html?.trim() ? (
          <section
            className="prose prose-stone max-w-none prose-headings:font-serif prose-p:text-muted"
            dangerouslySetInnerHTML={{ __html: content.body_html }}
          />
        ) : null}

        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl text-foreground">Manufacturing Videos</h2>
            <p className="text-xs text-muted">Tap a thumbnail to load and play.</p>
          </div>

          {featured ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted">Featured video</p>
              <AboutVideoPlayer
                title={featured.title}
                description={featured.description}
                poster={toPublicUrl(featured.thumbnail_key)}
                sources={mapVideoSources(featured)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted border border-rim rounded-sm bg-surface p-4">
              Videos will appear here once added in admin.
            </p>
          )}

          {rest.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted">More videos</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
