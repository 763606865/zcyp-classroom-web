"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/forms";
import { loadTcPlayer, type TcPlayerInstance } from "./tcplayer";

function tryAutoPlay(player: TcPlayerInstance) {
  const play = player.play?.();
  if (play && typeof play.catch === "function") {
    void play.catch(() => {
      player.muted?.(true);
      void player.play?.();
    });
  }
}

export function LiveStreamPlayer({
  src,
  fallbackUrl = "",
}: {
  src: string;
  fallbackUrl?: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const playerId = `live-player-${reactId}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let player: TcPlayerInstance | undefined;

    async function createPlayer() {
      setLoading(true);
      setError(undefined);
      const host = hostRef.current;
      if (!host) throw new Error("播放器容器未就绪");

      host.replaceChildren();
      const video = document.createElement("video");
      video.id = playerId;
      video.className = "h-full w-full";
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("preload", "auto");
      host.appendChild(video);

      const TCPlayer = await loadTcPlayer();
      if (cancelled) return;

      player = TCPlayer(playerId, {
        sources: [{ src }],
        autoplay: true,
        live: true,
        width: "100%",
        height: "100%",
        language: "zh-CN",
        webrtcConfig: fallbackUrl ? { fallbackUrl } : undefined,
      });
      player.ready(() => {
        if (!cancelled) tryAutoPlay(player!);
      });
      setLoading(false);
    }

    void createPlayer().catch((err: unknown) => {
      if (!cancelled) {
        setError(getApiErrorMessage(err, "直播播放器加载失败"));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      player?.dispose();
    };
  }, [fallbackUrl, playerId, src]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />
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
