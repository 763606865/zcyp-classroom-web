"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

function isHlsUrl(src: string) {
  return src.includes(".m3u8");
}

export function StreamPlayer({
  src,
  startAt = 0,
  autoPlay = false,
  onProgress,
  onEnded,
}: {
  src: string;
  startAt?: number;
  autoPlay?: boolean;
  onProgress?: (seconds: number) => void;
  onEnded?: (seconds: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReported = useRef(0);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onEndedRef.current = onEnded;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls | undefined;
    lastReported.current = Math.max(0, Math.floor(startAt));

    const tryPlay = () => {
      if (!autoPlay) return;
      const play = () => {
        const attempt = video.play();
        if (attempt) {
          void attempt.catch(() => {
            video.muted = true;
            void video.play().catch(() => undefined);
          });
        }
      };
      play();
    };

    if (isHlsUrl(src) && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    } else if (isHlsUrl(src) && Hls.isSupported()) {
      hls = new Hls({ enableWorker: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
    } else {
      video.src = src;
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    }

    const seekTo = startAt;
    const seek = () => {
      if (seekTo > 1 && Number.isFinite(seekTo) && seekTo < (video.duration || Number.POSITIVE_INFINITY)) {
        video.currentTime = seekTo;
      }
    };
    const flush = () => {
      const seconds = Math.floor(video.currentTime || 0);
      if (seconds > 0) onProgressRef.current?.(seconds);
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    video.addEventListener("loadedmetadata", seek);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      flush();
      video.removeEventListener("loadedmetadata", seek);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [autoPlay, src, startAt]);

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full rounded-xl bg-black"
      controls
      playsInline
      preload="auto"
      autoPlay={autoPlay}
      onTimeUpdate={(event) => {
        const seconds = Math.floor(event.currentTarget.currentTime);
        if (seconds - lastReported.current < 15) return;
        lastReported.current = seconds;
        onProgressRef.current?.(seconds);
      }}
      onPause={(event) => onProgressRef.current?.(Math.floor(event.currentTarget.currentTime))}
      onEnded={(event) => onEndedRef.current?.(Math.floor(event.currentTarget.currentTime))}
    />
  );
}
