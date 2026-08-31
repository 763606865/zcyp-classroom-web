"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/forms";
import type { LivePlayLine } from "./pick-live-line";
import { playTencentWebrtc } from "./play-tencent-webrtc";

function tryAutoPlay(video: HTMLVideoElement) {
  const attempt = video.play();
  if (attempt) {
    void attempt.catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }
}

function waitUntilPlaying(video: HTMLVideoElement, timeoutMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (!video.paused && video.readyState >= 2) {
      resolve();
      return;
    }
    const timer = window.setTimeout(() => finish(new Error("起播超时")), timeoutMs);
    const onPlaying = () => finish();
    const onError = () => finish(new Error("播放失败"));
    const onAbort = () => finish(new Error("已取消"));
    function finish(error?: Error) {
      window.clearTimeout(timer);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
      if (error) reject(error);
      else resolve();
    }
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);
    signal.addEventListener("abort", onAbort);
  });
}

async function playLine(
  video: HTMLVideoElement,
  line: LivePlayLine,
  signal: AbortSignal,
): Promise<() => void> {
  if (signal.aborted) throw new Error("已取消");

  if (line.kind === "webrtc") {
    const stop = await playTencentWebrtc(video, line.src);
    tryAutoPlay(video);
    await waitUntilPlaying(video, 8_000, signal);
    return stop;
  }

  if (line.kind === "flv") {
    if (!mpegts.isSupported()) throw new Error("当前浏览器不支持 FLV");
    const player = mpegts.createPlayer({ type: "flv", isLive: true, url: line.src }, { enableWorker: false, liveBufferLatencyChasing: true });
    player.attachMediaElement(video);
    player.load();
    tryAutoPlay(video);
    await waitUntilPlaying(video, 8_000, signal);
    return () => {
      player.destroy();
    };
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = line.src;
    tryAutoPlay(video);
    await waitUntilPlaying(video, 12_000, signal);
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }
  if (!Hls.isSupported()) throw new Error("当前浏览器不支持 HLS");
  const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
  hls.loadSource(line.src);
  hls.attachMedia(video);
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("HLS 清单超时")), 12_000);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      window.clearTimeout(timer);
      resolve();
    });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        window.clearTimeout(timer);
        reject(new Error("HLS 播放失败"));
      }
    });
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new Error("已取消"));
    });
  });
  tryAutoPlay(video);
  return () => hls.destroy();
}

export function LiveStreamPlayer({ lines }: { lines: LivePlayLine[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const key = lines.map((line) => `${line.kind}:${line.src}`).join("|");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || lines.length === 0) return;
    const media = video;
    const abort = new AbortController();
    let stop: (() => void) | undefined;

    async function start() {
      setLoading(true);
      setError(undefined);
      let lastError: unknown;
      for (const line of lines) {
        if (abort.signal.aborted) return;
        try {
          stop?.();
          stop = undefined;
          media.removeAttribute("src");
          media.srcObject = null;
          media.load();
          stop = await playLine(media, line, abort.signal);
          if (!abort.signal.aborted) setLoading(false);
          return;
        } catch (err) {
          lastError = err;
          stop?.();
          stop = undefined;
        }
      }
      if (!abort.signal.aborted) {
        setError(getApiErrorMessage(lastError, "直播播放失败"));
        setLoading(false);
      }
    }

    void start();
    return () => {
      abort.abort();
      stop?.();
      media.srcObject = null;
      media.removeAttribute("src");
      media.load();
    };
  }, [key]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        preload="auto"
        autoPlay
      />
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <Spinner label="加载直播" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : null}
    </div>
  );
}
