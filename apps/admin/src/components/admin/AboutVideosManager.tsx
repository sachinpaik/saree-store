"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  createAboutVideo,
  deleteAboutVideo,
  getAboutVideos,
  reorderAboutVideos,
  updateAboutVideo,
} from "@/lib/admin/about";
import { signUploadRequest } from "@/lib/upload-signer";
import { getMediaUrl } from "@/lib/media-url";
import { deleteStorageKeysViaWorker } from "@/lib/storage-worker-client";
import type { AboutVideo } from "@/types/database";

type VideoFormState = {
  id?: string;
  title: string;
  description: string;
  thumbnail_key: string;
  video_360_key: string;
  video_720_key: string;
  video_1080_key: string;
};

const EMPTY_VIDEO_FORM: VideoFormState = {
  title: "",
  description: "",
  thumbnail_key: "",
  video_360_key: "",
  video_720_key: "",
  video_1080_key: "",
};

type UploadProgress = {
  thumbnail: number;
  video360: number;
  video720: number;
  video1080: number;
};

const EMPTY_PROGRESS: UploadProgress = {
  thumbnail: 0,
  video360: 0,
  video720: 0,
  video1080: 0,
};

async function uploadWithProgress(
  putUrl: string,
  file: File,
  onProgress: (value: number) => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", putUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || e.total <= 0) return;
      const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
      onProgress(pct);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

function isMp4(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === "video/mp4" || name.endsWith(".mp4");
}

function isThumb(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png")
  );
}

export function AboutVideosManager() {
  const [videos, setVideos] = useState<AboutVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<VideoFormState>(EMPTY_VIDEO_FORM);
  const [progress, setProgress] = useState<UploadProgress>(EMPTY_PROGRESS);

  const isEdit = Boolean(editing.id);
  const orderedVideos = useMemo(
    () => [...videos].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
    [videos]
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    const data = await getAboutVideos();
    setVideos(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setEditing(EMPTY_VIDEO_FORM);
    setProgress(EMPTY_PROGRESS);
  }

  async function uploadAsset(
    file: File,
    field: "thumbnail_key" | "video_360_key" | "video_720_key" | "video_1080_key",
    progressKey: keyof UploadProgress
  ) {
    setError(null);
    if (field === "thumbnail_key" && !isThumb(file)) {
      setError("Thumbnail must be JPG or PNG");
      return;
    }
    if (field !== "thumbnail_key" && !isMp4(file)) {
      setError("Videos must be MP4 files");
      return;
    }

    try {
      setProgress((prev) => ({ ...prev, [progressKey]: 1 }));
      const { putUrl, storageKey } = await signUploadRequest(file, "about-videos", "final");
      await uploadWithProgress(putUrl, file, (value) =>
        setProgress((prev) => ({ ...prev, [progressKey]: value }))
      );
      setEditing((prev) => ({ ...prev, [field]: storageKey }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress((prev) => ({ ...prev, [progressKey]: 0 }));
    }
  }

  async function handleSaveVideo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!editing.video_360_key && !editing.video_720_key) {
      setError("At least one quality is required (360p or 720p)");
      return;
    }

    setSaving(true);
    const payload = {
      title: editing.title.trim(),
      description: editing.description.trim(),
      thumbnail_key: editing.thumbnail_key || null,
      video_360_key: editing.video_360_key || null,
      video_720_key: editing.video_720_key || null,
      video_1080_key: editing.video_1080_key || null,
      sort_order: editing.id
        ? videos.find((v) => v.id === editing.id)?.sort_order ?? videos.length
        : videos.length,
    };

    const result = editing.id
      ? await updateAboutVideo(editing.id, payload)
      : await createAboutVideo(payload);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(editing.id ? "Video updated" : "Video added");
    resetForm();
    await refresh();
  }

  async function handleDelete(video: AboutVideo) {
    setError(null);
    setSuccess(null);
    const keys = [
      video.thumbnail_key,
      video.video_360_key,
      video.video_720_key,
      video.video_1080_key,
    ].filter((v): v is string => Boolean(v));

    if (keys.length > 0) {
      try {
        await deleteStorageKeysViaWorker(keys);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete video files from storage");
        return;
      }
    }

    const result = await deleteAboutVideo(video.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess("Video deleted");
    await refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedVideos.length) return;
    const next = [...orderedVideos];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    const result = await reorderAboutVideos(next.map((v) => v.id));
    if (result.error) {
      setError(result.error);
      return;
    }
    setVideos(next.map((v, i) => ({ ...v, sort_order: i })));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveVideo} className="space-y-4 rounded border border-stone-200 bg-white p-4">
        <h2 className="text-base font-semibold text-stone-900">{isEdit ? "Edit video" : "Add video"}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={editing.description}
            onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-stone-300 rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Thumbnail (JPG/PNG)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void uploadAsset(file, "thumbnail_key", "thumbnail");
              }}
              className="block w-full text-sm"
            />
            {progress.thumbnail > 0 && progress.thumbnail < 100 && (
              <p className="text-xs text-stone-500 mt-1">Uploading: {progress.thumbnail}%</p>
            )}
            {editing.thumbnail_key && (
              <div className="mt-2 relative h-28 w-44 border border-stone-200 rounded overflow-hidden bg-stone-100">
                <Image src={getMediaUrl(editing.thumbnail_key)} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Video 360p (MP4)</label>
              <input
                type="file"
                accept=".mp4,video/mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadAsset(file, "video_360_key", "video360");
                }}
                className="block w-full text-sm"
              />
              {progress.video360 > 0 && progress.video360 < 100 && (
                <p className="text-xs text-stone-500 mt-1">Uploading: {progress.video360}%</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Video 720p (MP4)</label>
              <input
                type="file"
                accept=".mp4,video/mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadAsset(file, "video_720_key", "video720");
                }}
                className="block w-full text-sm"
              />
              {progress.video720 > 0 && progress.video720 < 100 && (
                <p className="text-xs text-stone-500 mt-1">Uploading: {progress.video720}%</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Video 1080p (MP4, optional)</label>
              <input
                type="file"
                accept=".mp4,video/mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadAsset(file, "video_1080_key", "video1080");
                }}
                className="block w-full text-sm"
              />
              {progress.video1080 > 0 && progress.video1080 < 100 && (
                <p className="text-xs text-stone-500 mt-1">Uploading: {progress.video1080}%</p>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Update video" : "Add video"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded hover:bg-stone-50"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="rounded border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left px-3 py-2 font-medium">Video</th>
              <th className="text-left px-3 py-2 font-medium">Qualities</th>
              <th className="text-right px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              orderedVideos.map((video, index) => {
                const qualities = [
                  video.video_360_key ? "360p" : null,
                  video.video_720_key ? "720p" : null,
                  video.video_1080_key ? "1080p" : null,
                ].filter(Boolean) as string[];

                return (
                  <tr key={video.id} className="border-b border-stone-100">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 bg-stone-100 rounded overflow-hidden shrink-0">
                          {video.thumbnail_key ? (
                            <Image
                              src={getMediaUrl(video.thumbnail_key)}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{video.title}</p>
                          {video.description && (
                            <p className="text-xs text-stone-500">{video.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-stone-600">
                      {qualities.length > 0 ? qualities.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              id: video.id,
                              title: video.title,
                              description: video.description ?? "",
                              thumbnail_key: video.thumbnail_key ?? "",
                              video_360_key: video.video_360_key ?? "",
                              video_720_key: video.video_720_key ?? "",
                              video_1080_key: video.video_1080_key ?? "",
                            })
                          }
                          className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMove(index, -1)}
                          disabled={index === 0}
                          className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMove(index, 1)}
                          disabled={index === orderedVideos.length - 1}
                          className="px-2 py-1 text-xs border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(video)}
                          className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && orderedVideos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-stone-500">
                  No videos added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
