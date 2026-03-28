"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

type QualityOption = "auto" | "360p" | "720p" | "1080p";

export type AboutVideoSources = {
  "360p"?: string;
  "720p"?: string;
  "1080p"?: string;
};

function pickAutoQuality(available: QualityOption[]): QualityOption {
  if (typeof navigator === "undefined") return available.includes("720p") ? "720p" : available[0];
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } })
    .connection as
    | { effectiveType?: string; saveData?: boolean }
    | undefined;

  if (connection?.saveData) {
    if (available.includes("360p")) return "360p";
    if (available.includes("720p")) return "720p";
    return available[0];
  }

  if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") {
    if (available.includes("360p")) return "360p";
  }

  if (connection?.effectiveType === "3g") {
    if (available.includes("720p")) return "720p";
    if (available.includes("360p")) return "360p";
  }

  if (available.includes("1080p")) return "1080p";
  if (available.includes("720p")) return "720p";
  if (available.includes("360p")) return "360p";
  return available[0];
}

function getDirectQuality(
  selected: QualityOption,
  available: QualityOption[]
): Exclude<QualityOption, "auto"> {
  if (selected !== "auto" && available.includes(selected)) return selected;
  const auto = pickAutoQuality(available);
  return auto === "auto" ? "720p" : auto;
}

export function AboutVideoPlayer({
  title,
  description,
  poster,
  sources,
}: {
  title: string;
  description?: string;
  poster?: string | null;
  sources: AboutVideoSources;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [loadingSwitch, setLoadingSwitch] = useState(false);
  const [selection, setSelection] = useState<QualityOption>("auto");

  const available = useMemo(() => {
    const out: QualityOption[] = ["auto"];
    if (sources["360p"]) out.push("360p");
    if (sources["720p"]) out.push("720p");
    if (sources["1080p"]) out.push("1080p");
    return out;
  }, [sources]);

  const direct = getDirectQuality(selection, available);
  const source = sources[direct] ?? sources["720p"] ?? sources["360p"] ?? sources["1080p"] ?? "";

  function activate() {
    setIsActivated(true);
  }

  function handleQualityChange(next: QualityOption) {
    const video = videoRef.current;
    const wasPlaying = Boolean(video && !video.paused && !video.ended);
    const previousTime = video?.currentTime ?? 0;
    setSelection(next);
    setLoadingSwitch(true);

    requestAnimationFrame(() => {
      const fresh = videoRef.current;
      if (!fresh) return;
      const onMeta = () => {
        try {
          fresh.currentTime = Math.min(previousTime, Number.isFinite(fresh.duration) ? fresh.duration || previousTime : previousTime);
        } catch {
          // no-op: browsers may block seeking before metadata is ready
        }
        if (wasPlaying) {
          void fresh.play().catch(() => {
            // user gesture policies may block autoplay after quality change
          });
        }
        setLoadingSwitch(false);
      };
      fresh.addEventListener("loadedmetadata", onMeta, { once: true });
      fresh.load();
    });
  }

  return (
    <article className="border border-rim rounded-sm bg-surface overflow-hidden">
      {!isActivated ? (
        <button
          type="button"
          onClick={activate}
          className="group relative w-full aspect-video bg-stone-900"
          aria-label={`Play ${title}`}
        >
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-stone-800" />
          )}
          <span className="absolute inset-0 bg-black/20" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-stone-900">
              ▶
            </span>
          </span>
        </button>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black"
            controls
            preload="metadata"
            poster={poster ?? undefined}
          >
            <source src={source} type="video/mp4" />
          </video>
          {loadingSwitch && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-white text-xs">
              Switching quality...
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-foreground text-sm md:text-base">{title}</h3>
          <label className="flex items-center gap-2 text-xs text-muted shrink-0">
            Quality
            <select
              value={selection}
              onChange={(e) => handleQualityChange(e.target.value as QualityOption)}
              className="border border-rim bg-background rounded-sm px-2 py-1 text-foreground"
            >
              {available.map((q) => (
                <option key={q} value={q}>
                  {q === "auto" ? `Auto (${direct})` : q}
                </option>
              ))}
            </select>
          </label>
        </div>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
    </article>
  );
}
