"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { VodPlayAuth } from "@/entities/learn";
import { getApiErrorMessage } from "@/lib/forms";
import { loadAliplayer, type AliplayerInstance } from "./aliplayer";
import { getLessonPlayAuth } from "./api";
import { StreamPlayer } from "./stream-player";
import { loadTcPlayer, type TcPlayerInstance } from "./tcplayer";
import { resolveTencentVodUrl } from "./tencent-vod-url";

type PlayerHandle = {
  dispose: () => void;
  getCurrentTime: () => number;
};

function mediaIdOf(auth: VodPlayAuth) {
  return String(auth.media_id);
}

function providerOf(auth: VodPlayAuth): "aliyun" | "tencent" {
  return auth.provider === "tencent" ? "tencent" : "aliyun";
}

function mountContainer(host: HTMLElement, id: string, tag: "div" | "video") {
  host.replaceChildren();
  const el = document.createElement(tag);
  el.id = id;
  el.className = "h-full w-full";
  if (tag === "video") {
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.setAttribute("preload", "auto");
  }
  host.appendChild(el);
  return el;
}

function attachProgress(
  on: (event: string, handler: (...args: unknown[]) => void) => void,
  getCurrentTime: () => number,
  lastReported: { current: number },
  onProgress: { current?: (seconds: number) => void },
  onEnded: { current?: (seconds: number) => void },
) {
  on("timeupdate", () => {
    const seconds = Math.floor(getCurrentTime() || 0);
    if (seconds - lastReported.current < 15) return;
    lastReported.current = seconds;
    onProgress.current?.(seconds);
  });
  on("pause", () => {
    onProgress.current?.(Math.floor(getCurrentTime() || 0));
  });
  on("ended", () => {
    onEnded.current?.(Math.floor(getCurrentTime() || 0));
  });
  on("error", () => {
    onProgress.current?.(Math.floor(getCurrentTime() || 0));
  });
}

async function createAliPlayer(
  playerId: string,
  auth: VodPlayAuth,
  startAt: number,
): Promise<{ player: AliplayerInstance; handle: PlayerHandle }> {
  const Aliplayer = await loadAliplayer();
  const player = new Aliplayer({
    id: playerId,
    vid: mediaIdOf(auth),
    playauth: auth.play_auth,
    autoplay: false,
    width: "100%",
    height: "100%",
    useH5Prism: true,
  }, () => {
    if (startAt > 1) player.seek(startAt);
  });
  return {
    player,
    handle: {
      dispose: () => player.dispose(),
      getCurrentTime: () => player.getCurrentTime() || 0,
    },
  };
}

async function createTencentPlayer(
  playerId: string,
  auth: VodPlayAuth,
  startAt: number,
): Promise<{ player: TcPlayerInstance; handle: PlayerHandle }> {
  const appId = auth.app_id == null || auth.app_id === "" ? "" : String(auth.app_id);
  if (!appId) throw new Error("腾讯云点播缺少 app_id，无法播放");
  const TCPlayer = await loadTcPlayer();
  const player = TCPlayer(playerId, {
    fileID: mediaIdOf(auth),
    appID: appId,
    psign: auth.play_auth,
    autoplay: false,
    width: "100%",
    height: "100%",
    language: "zh-CN",
  });
  player.ready(() => {
    if (startAt > 1) player.currentTime(startAt);
  });
  return {
    player,
    handle: {
      dispose: () => player.dispose(),
      getCurrentTime: () => Number(player.currentTime()) || 0,
    },
  };
}

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
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerHandle | null>(null);
  const startAtRef = useRef(startAt);
  const lastReported = useRef(0);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [tencentSrc, setTencentSrc] = useState<string>();
  const [tencentStartAt, setTencentStartAt] = useState(startAt);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onEndedRef.current = onEnded;
    startAtRef.current = startAt;
  });

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;
    lastReported.current = Math.max(0, Math.floor(startAtRef.current));

    let aliPlayer: AliplayerInstance | undefined;
    let tencentPlayer: TcPlayerInstance | undefined;

    async function createPlayer() {
      setLoading(true);
      setError(undefined);
      const host = hostRef.current;
      if (!host) throw new Error("播放器容器未就绪");

      const authResult = await getLessonPlayAuth(courseId, lessonId);
      if (cancelled) return;
      const auth = authResult.data;
      const provider = providerOf(auth);

      playerRef.current?.dispose();
      playerRef.current = null;
      setTencentSrc(undefined);
      mountContainer(host, playerId, provider === "tencent" ? "video" : "div");

      if (provider === "tencent") {
        try {
          const playUrl = await resolveTencentVodUrl(auth);
          if (cancelled) return;
          setTencentSrc(playUrl);
          setTencentStartAt(startAtRef.current);
          setLoading(false);
          const expiresIn = auth.expires_in ?? 3000;
          refreshTimer = window.setTimeout(() => {
            void refreshAuth(provider);
          }, Math.max((expiresIn - 90) * 1000, 30_000));
          return;
        } catch {
          // GetPlayInfo 失败时回退到 TCPlayer fileID 播放。
        }
        const created = await createTencentPlayer(playerId, auth, startAtRef.current);
        if (cancelled) {
          created.handle.dispose();
          return;
        }
        tencentPlayer = created.player;
        playerRef.current = created.handle;
        attachProgress(created.player.on.bind(created.player), created.handle.getCurrentTime, lastReported, onProgressRef, onEndedRef);
      } else {
        const created = await createAliPlayer(playerId, auth, startAtRef.current);
        if (cancelled) {
          created.handle.dispose();
          return;
        }
        aliPlayer = created.player;
        playerRef.current = created.handle;
        attachProgress(created.player.on.bind(created.player), created.handle.getCurrentTime, lastReported, onProgressRef, onEndedRef);
      }

      const expiresIn = auth.expires_in ?? 3000;
      refreshTimer = window.setTimeout(() => {
        void refreshAuth(provider);
      }, Math.max((expiresIn - 90) * 1000, 30_000));
      setLoading(false);
    }

    async function refreshAuth(provider: "aliyun" | "tencent") {
      try {
        const next = await getLessonPlayAuth(courseId, lessonId);
        if (cancelled) return;
        const auth = next.data;
        const current = Math.floor(playerRef.current?.getCurrentTime() || lastReported.current || 0);
        if (provider === "tencent") {
          try {
            const playUrl = await resolveTencentVodUrl(auth);
            if (cancelled) return;
            setTencentStartAt(current);
            setTencentSrc(playUrl);
          } catch {
            const appId = auth.app_id == null || auth.app_id === "" ? "" : String(auth.app_id);
            tencentPlayer?.loadVideoByID?.({
              fileID: mediaIdOf(auth),
              appID: appId,
              psign: auth.play_auth,
            });
            tencentPlayer?.ready?.(() => {
              if (current > 1) tencentPlayer?.currentTime(current);
            });
          }
        } else {
          aliPlayer?.replayByVidAndPlayauth?.(mediaIdOf(auth), auth.play_auth);
        }
        const expiresIn = auth.expires_in ?? 3000;
        refreshTimer = window.setTimeout(() => {
          void refreshAuth(provider);
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
      {tencentSrc ? (
        <StreamPlayer
          src={tencentSrc}
          startAt={tencentStartAt}
          autoPlay
          onProgress={onProgress}
          onEnded={onEnded}
        />
      ) : null}
      <div ref={hostRef} className={tencentSrc ? "hidden" : "absolute inset-0 h-full w-full"} />
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
