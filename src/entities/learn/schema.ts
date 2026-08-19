import { z } from "zod";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const lessonProgressSchema = z.object({
  status: z.string().optional(),
  progress_seconds: nullableNumber,
  progress: nullableNumber,
  started_at: nullableString,
  last_learned_at: nullableString,
  completed_at: nullableString,
}).passthrough();

export const lessonLiveSessionSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  status: z.string(),
  scheduled_start_at: nullableString,
  scheduled_end_at: nullableString,
  actual_start_at: nullableString,
  actual_end_at: nullableString,
  playback: z.unknown().nullable().optional(),
}).passthrough();

export const learnLessonSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.string(),
  media_url: nullableString,
  media_id: z.union([z.string(), z.number()]).nullable().optional(),
  live_session_id: nullableNumber,
  live_sessions: z.array(lessonLiveSessionSchema).optional(),
  duration_seconds: nullableNumber,
  is_free_preview: z.boolean().optional(),
  progress: lessonProgressSchema.nullable().optional(),
}).passthrough();

export const learnChapterSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: nullableString,
  sort: z.number().optional(),
  lessons: z.array(learnLessonSchema),
}).passthrough();

export const courseLearnSchema = z.object({
  course: z.object({
    id: z.number(),
    title: z.string(),
    type: z.string().optional(),
    duration_minutes: nullableNumber,
    lesson_count: nullableNumber,
  }).passthrough(),
  enrollment: z.object({
    status: z.string(),
    progress: z.number().optional(),
    enrolled_at: nullableString,
    last_learned_at: nullableString,
    completed_at: nullableString,
  }).passthrough(),
  summary: z.object({
    total_lessons: z.number(),
    completed_lessons: z.number(),
    continue_lesson_id: z.number().nullable().optional(),
  }).passthrough(),
  chapters: z.array(learnChapterSchema),
  ungrouped_lessons: z.array(learnLessonSchema).optional(),
}).passthrough();

export const updateLessonProgressSchema = z.object({
  message: z.string().optional(),
  lesson_progress: lessonProgressSchema,
  course_progress: z.object({
    status: z.string(),
    progress: z.number().optional(),
    last_learned_at: nullableString,
    completed_at: nullableString,
  }).passthrough(),
}).passthrough();

export const liveSessionSchema = z.object({
  session: z.object({
    id: z.number(),
    course_id: z.number().optional(),
    lesson_id: z.number().optional(),
    title: z.string().optional(),
    status: z.string(),
    scheduled_start_at: nullableString,
    scheduled_end_at: nullableString,
    actual_start_at: nullableString,
    actual_end_at: nullableString,
    online_count: z.number().optional(),
  }).passthrough(),
  play_urls: z.object({
    webrtc: nullableString,
    flv: nullableString,
    hls: nullableString,
    expires_at: nullableString,
  }).passthrough().nullable().optional(),
  playback: z.object({
    file_id: nullableString,
    url: nullableString,
    play_url: nullableString,
    media_url: nullableString,
    hls: nullableString,
  }).passthrough().nullable().optional(),
}).passthrough();

export const vodPlayAuthSchema = z.object({
  media_id: z.string(),
  play_auth: z.string(),
  expires_in: z.number().optional(),
}).passthrough();

export type LearnLesson = z.infer<typeof learnLessonSchema>;
export type CourseLearn = z.infer<typeof courseLearnSchema>;
export type LiveSessionPayload = z.infer<typeof liveSessionSchema>;
export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export type LessonLiveSession = z.infer<typeof lessonLiveSessionSchema>;
export type VodPlayAuth = z.infer<typeof vodPlayAuthSchema>;
