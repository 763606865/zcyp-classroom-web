import { z } from "zod";
import {
  courseLearnSchema,
  liveSessionSchema,
  updateLessonProgressSchema,
  vodPlayAuthSchema,
  courseCommentListSchema,
  courseInteractionSchema,
  coursewaresSchema,
  submitCourseCommentSchema,
  lessonPracticesSchema,
  practiceAttemptSchema,
  type CourseCommentList,
  type CourseInteraction,
  type CourseLearn,
  type Courseware,
  type LessonPracticeSummary,
  type LiveSessionPayload,
  type PracticeAttempt,
  type VodPlayAuth,
} from "@/entities/learn";
import { apiClient, getWebClientInfo } from "@/lib/http";

export function getCourseInteractions(courseId: number) {
  return apiClient.get<CourseInteraction>(`/api/classroom/courses/${courseId}/interactions`, {
    responseSchema: courseInteractionSchema,
    retry: 0,
  });
}

export function favoriteCourse(courseId: number) {
  return apiClient.post<CourseInteraction>(`/api/me/courses/${courseId}/favorite`, {}, {
    responseSchema: courseInteractionSchema,
    retry: 0,
  });
}

export function unfavoriteCourse(courseId: number) {
  return apiClient.delete<CourseInteraction>(`/api/me/courses/${courseId}/favorite`, {
    responseSchema: courseInteractionSchema,
    retry: 0,
  });
}

export function likeCourse(courseId: number) {
  return apiClient.post<CourseInteraction>(`/api/me/courses/${courseId}/like`, {}, {
    responseSchema: courseInteractionSchema,
    retry: 0,
  });
}

export function unlikeCourse(courseId: number) {
  return apiClient.delete<CourseInteraction>(`/api/me/courses/${courseId}/like`, {
    responseSchema: courseInteractionSchema,
    retry: 0,
  });
}

export function shareCourse(courseId: number, channel: "link" | "wechat" | "moments" | "qq" | "weibo" | "other" = "link") {
  return apiClient.post<CourseInteraction>(`/api/classroom/courses/${courseId}/share`, {
    channel,
    client: "web",
  }, {
    responseSchema: courseInteractionSchema,
    retry: 0,
  });
}

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

export function getCourseComments(courseId: number, page = 1) {
  return apiClient.get<CourseCommentList>(`/api/classroom/courses/${courseId}/comments`, {
    query: { per_page: 15, page },
    responseSchema: courseCommentListSchema,
    retry: 0,
  });
}

export function submitCourseComment(
  courseId: number,
  body: { rating: number; content: string; is_anonymous?: boolean },
) {
  return apiClient.post<z.infer<typeof submitCourseCommentSchema>>(
    `/api/me/courses/${courseId}/comment`,
    body,
    { responseSchema: submitCourseCommentSchema, retry: 0 },
  );
}

export function getCoursewares(courseId: number) {
  return apiClient.get<Courseware[]>(`/api/me/courses/${courseId}/coursewares`, {
    responseSchema: coursewaresSchema,
    retry: 0,
  });
}

export function getLessonPlayAuth(courseId: number, lessonId: number) {
  return apiClient.get<VodPlayAuth>(`/api/me/courses/${courseId}/lessons/${lessonId}/play-auth`, {
    responseSchema: vodPlayAuthSchema,
    retry: 0,
  });
}

export function hasVodMedia(mediaId?: string | number | null) {
  if (mediaId == null || mediaId === "") return false;
  if (typeof mediaId === "number") return Number.isFinite(mediaId) && mediaId > 0;
  return mediaId.length > 0;
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

export function getLessonPractices(courseId: number, lessonId: number) {
  return apiClient.get<LessonPracticeSummary[]>(
    `/api/me/courses/${courseId}/lessons/${lessonId}/practices`,
    { responseSchema: lessonPracticesSchema, retry: 0 },
  );
}

export function startLessonPractice(courseId: number, lessonId: number, practiceId: number) {
  return apiClient.post<PracticeAttempt>(
    `/api/me/courses/${courseId}/lessons/${lessonId}/practices/${practiceId}/start`,
    {},
    { responseSchema: practiceAttemptSchema, retry: 0 },
  );
}

export function getPracticeAttempt(userPracticeId: number) {
  return apiClient.get<PracticeAttempt>(`/api/me/practices/${userPracticeId}`, {
    responseSchema: practiceAttemptSchema,
    retry: 0,
  });
}

export function submitPracticeQuestionAnswer(
  userPracticeId: number,
  questionId: number,
  answer: string[],
) {
  return apiClient.post<PracticeAttempt>(
    `/api/me/practices/${userPracticeId}/questions/${questionId}/answer`,
    { answer },
    { responseSchema: practiceAttemptSchema, retry: 0 },
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
