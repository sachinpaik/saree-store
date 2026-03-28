import { AboutVideosManager } from "@/components/admin/AboutVideosManager";

export default function AdminAboutVideosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">About Videos</h1>
      <p className="text-sm text-stone-600">
        Upload manual FFmpeg outputs (360p/720p/1080p), manage metadata, order, and publish status.
      </p>
      <AboutVideosManager />
    </div>
  );
}
