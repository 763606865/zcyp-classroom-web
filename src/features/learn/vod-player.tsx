"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/forms";
import { loadAliplayer, type AliplayerInstance } from "./aliplayer";
import { getLessonPlayAuth } from "./api";

export function VodPlayer({
  courseId,
  lessonId,
  startAt = 0,
  onProgress,
  onEnded,
}: {
  courseId: number;
  lessonId: number;
  startAt?: number;
  onProgress?: (seconds: number) => void;
  onEnded?: (seconds: number) => void;
}) {
  const reactId = useId().replace(/:/g, "");
  const playerId = `vod-player-${lessonId}-${reactId}`;
  const playerRef = useRef<AliplayerInstance | null>(null);
  const startAtRef = useRef(startAt);
  const lastReported = useRef(0);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  onProgressRef.current = onProgress;
  onEndedRef.current = onEnded;
  startAtRef.current = startAt;

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;
    lastReported.current = Math.max(0, Math.floor(startAtRef.current));

    async function createPlayer() {
      setLoading(true);
      setError(undefined);
      const [Aliplayer, auth] = await Promise.all([
        loadAliplayer(),
        getLessonPlayAuth(courseId, lessonId),
      ]);
      if (cancelled) return;

      playerRef.current?.dispose();
      const player = new Aliplayer({
        id: playerId,
        vid: auth.data.media_id,
        playauth: auth.data.play_auth,
        autoplay: false,
        width: "100%",
        height: "100%",
        useH5Prism: true,
      }, () => {
        const resume = startAtRef.current;
        if (resume > 1) player.seek(resume);
      });
      playerRef.current = player;

      player.on("timeupdate", () => {
        const seconds = Math.floor(player.getCurrentTime() || 0);
        if (seconds - lastReported.current < 15) return;
        lastReported.current = seconds;
        onProgressRef.current?.(seconds);
      });
      player.on("pause", () => {
        onProgressRef.current?.(Math.floor(player.getCurrentTime() || 0));
      });
      player.on("ended", () => {
        onEndedRef.current?.(Math.floor(player.getCurrentTime() || 0));
      });
      player.on("error", () => {
        onProgressRef.current?.(Math.floor(player.getCurrentTime() || 0));
      });

      const expiresIn = auth.data.expires_in ?? 3000;
      refreshTimer = window.setTimeout(() => {
        void refreshAuth(player);
      }, Math.max((expiresIn - 90) * 1000, 30_000));
      setLoading(false);
    }

    async function refreshAuth(player: AliplayerInstance) {
      try {
        const auth = await getLessonPlayAuth(courseId, lessonId);
        if (cancelled) return;
        player.replayByVidAndPlayauth?.(auth.data.media_id, auth.data.play_auth);
        const expiresIn = auth.data.expires_in ?? 3000;
        refreshTimer = window.setTimeout(() => {
          void refreshAuth(player);
        }, Math.max((expiresIn - 90) * 1000, 30_000));
      } catch {
        // 凭证刷新失败时保留当前播放，过期后再由用户切换课时重试。
      }
    }

    void createPlayer().catch((err: unknown) => {
      if (!cancelled) {
        setError(getApiErrorMessage(err, "视频播放凭证获取失败"));
        setLoading(false);
      }
    });

    const flush = () => {
      const seconds = Math.floor(playerRef.current?.getCurrentTime() || 0);
      if (seconds > 0) onProgressRef.current?.(seconds);
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      cancelled = true;
      flush();
      if (refreshTimer) window.clearTimeout(refreshTimer);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [courseId, lessonId, playerId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div id={playerId} className="absolute inset-0 h-full w-full" />
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <Spinner label="加载视频" />
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
