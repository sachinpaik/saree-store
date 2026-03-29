import { AboutPage, getAboutContent, getAboutVideos, getStoreSettings } from "@/storefront";

export const metadata = {
  title: "About Silk Manufacturing",
  description: "Learn how our silk sarees are crafted and watch the process videos.",
};

export const dynamic = "force-static";

export default async function Page() {
  const [content, videos, settings] = await Promise.all([
    getAboutContent().catch(() => null),
    getAboutVideos().catch(() => []),
    getStoreSettings().catch(() => null),
  ]);

  return <AboutPage content={content} videos={videos} settings={settings} />;
}
