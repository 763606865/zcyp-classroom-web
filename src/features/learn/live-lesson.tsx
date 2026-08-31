"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { LiveSessionPayload } from "@/entities/learn";
import { formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getLiveSession, sendLiveHeartbeat } from "./api";
import { LiveStreamPlayer } from "./live-stream-player";
import { orderedLiveLines } from "./pick-live-line";
import { StreamPlayer } from "./stream-player";

function playbackUrl(payload: LiveSessionPayload) {
  const playback = payload.playback;
  return playback?.hls ?? playback?.play_url ?? playback?.url ?? playback?.media_url ?? null;
}

export function LiveLessonView({
  sessionId,
  initialSeconds = 0,
  onReport,
}: {
  sessionId: number;
  initialSeconds?: number;
  onReport: (body: { progress_seconds?: number; completed?: boolean }) => void;
}) {
  const [payload, setPayload] = useState<LiveSessionPayload>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const baseSeconds = useRef(Math.max(0, Math.floor(initialSeconds)));
  const joinedAt = useRef<number | null>(null);
  const onReportRef = useRef(onReport);

  useEffect(() => {
    onReportRef.current = onReport;
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getLiveSession(sessionId);
        if (!cancelled) {
          setPayload(result.data);
          setError(undefined);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "直播信息加载失败"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [sessionId]);

  const status = payload?.session.status;
  const living = status === "living";

  useEffect(() => {
    if (!living) return;
    let stopped = false;
    joinedAt.current = Date.now();
    const accumulated = () => {
      const extra = joinedAt.current ? Math.floor((Date.now() - joinedAt.current) / 1000) : 0;
      return baseSeconds.current + Math.max(0, extra);
    };
    void sendLiveHeartbeat(sessionId, "join").catch(() => undefined);
    onReportRef.current({ progress_seconds: accumulated() });

    const timer = window.setInterval(() => {
      if (stopped || document.visibilityState !== "visible") return;
      void sendLiveHeartbeat(sessionId, "heartbeat").catch(() => undefined);
      onReportRef.current({ progress_seconds: accumulated() });
    }, 45_000);

    const leave = () => {
      if (stopped) return;
      stopped = true;
      onReportRef.current({ progress_seconds: accumulated() });
      void sendLiveHeartbeat(sessionId, "leave").catch(() => undefined);
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [living, sessionId]);

  const completedSent = useRef(false);
  useEffect(() => {
    if (completedSent.current) return;
    if (status === "recording" || status === "playback" || status === "ended") {
      completedSent.current = true;
      onReportRef.current({ completed: true });
    }
  }, [status]);

  if (loading && !payload) {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-muted"><Spinner label="加载直播" /></div>;
  }
  if (error || !payload) {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">{error ?? "暂无直播信息"}</div>;
  }

  const liveLines = orderedLiveLines(payload.play_urls);
  const replay = playbackUrl(payload);
  const session = payload.session;

  if (status === "pending") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted p-6 text-center">
        <p className="font-medium">{session.title ?? "直播未开始"}</p>
        <p className="text-sm text-muted-foreground">计划开始 {formatDateTime(session.scheduled_start_at)}</p>
      </div>
    );
  }

  if (status === "living" && liveLines.length > 0) {
    return (
      <div>
        <LiveStreamPlayer lines={liveLines} />
        <p className="mt-2 text-sm text-muted-foreground">
          直播中{session.online_count != null ? ` · ${session.online_count} 人在看` : ""}
        </p>
      </div>
    );
  }

  if (status === "living" && liveLines.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
        直播已开始，但当前没有可用的播放地址。
      </div>
    );
  }

  if (status === "recording") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-muted p-6 text-center">
        <p className="font-medium">直播已结束</p>
        <p className="text-sm text-muted-foreground">回放生成中，请稍后刷新。</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>刷新</Button>
      </div>
    );
  }

  if ((status === "playback" || status === "ended") && replay) {
    return (
      <div>
        <StreamPlayer src={replay} autoPlay />
        <p className="mt-2 text-sm text-muted-foreground">直播回放</p>
      </div>
    );
  }

  if (status === "cancelled") {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">本场直播已取消</div>;
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
      直播已结束，暂无回放。
    </div>
  );
}
