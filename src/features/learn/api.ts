import { z } from "zod";
import {
  courseLearnSchema,
  liveSessionSchema,
  updateLessonProgressSchema,
  vodPlayAuthSchema,
  type CourseLearn,
  type LiveSessionPayload,
  type VodPlayAuth,
} from "@/entities/learn";
import { apiClient, getWebClientInfo } from "@/lib/http";

export function getCourseLearn(courseId: number) {
  return apiClient.get<CourseLearn>(`/api/me/courses/${courseId}/progress`, {
    responseSchema: courseLearnSchema,
    retry: 0,
  });
}

export type LessonProgressBody = {
  progress_seconds?: number;
  completed?: boolean;
};

export function getLessonPlayAuth(courseId: number, lessonId: number) {
  return apiClient.get<VodPlayAuth>(`/api/me/courses/${courseId}/lessons/${lessonId}/play-auth`, {
    responseSchema: vodPlayAuthSchema,
    retry: 0,
  });
}

export function isVodMediaId(mediaId?: string | number | null) {
  return typeof mediaId === "string" && mediaId.length > 8 && !/^\d+$/.test(mediaId);
}

export function updateLessonProgress(
  courseId: number,
  lessonId: number,
  body: LessonProgressBody,
) {
  return apiClient.put<z.infer<typeof updateLessonProgressSchema>>(
    `/api/me/courses/${courseId}/lessons/${lessonId}/progress`,
    body,
    { responseSchema: updateLessonProgressSchema, retry: 0 },
  );
}

export function getLiveSession(liveSessionId: number) {
  return apiClient.get<LiveSessionPayload>(`/api/live-sessions/${liveSessionId}`, {
    responseSchema: liveSessionSchema,
    retry: 0,
  });
}

export function sendLiveHeartbeat(liveSessionId: number, action: "join" | "heartbeat" | "leave") {
  return apiClient.post(`/api/live-sessions/${liveSessionId}/heartbeat`, {
    action,
    device_id: getWebClientInfo().deviceId,
  }, { retry: 0 });
}

export function resolveLiveSessionId(lesson: {
  live_session_id?: number | null;
  live_sessions?: Array<{ id: number; status?: string; scheduled_start_at?: string | null }>;
  media_id?: string | number | null;
}) {
  if (lesson.live_session_id) return lesson.live_session_id;
  const picked = pickLiveSession(lesson.live_sessions);
  if (picked) return picked.id;
  const raw = lesson.media_id;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return null;
}

const liveStatusPriority: Record<string, number> = {
  living: 0,
  playback: 1,
  recording: 2,
  pending: 3,
  ended: 4,
};

export function pickLiveSession<T extends { id: number; status?: string; scheduled_start_at?: string | null }>(
  sessions?: T[],
) {
  if (!sessions?.length) return null;
  return [...sessions].sort((a, b) => {
    const statusDiff = (liveStatusPriority[a.status ?? ""] ?? 9) - (liveStatusPriority[b.status ?? ""] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return (Date.parse(a.scheduled_start_at ?? "") || 0) - (Date.parse(b.scheduled_start_at ?? "") || 0) || a.id - b.id;
  })[0];
}
