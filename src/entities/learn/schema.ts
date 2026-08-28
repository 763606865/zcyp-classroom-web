import { z } from "zod";
import { teacherSchema } from "@/entities/classroom";

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
  media_provider: z.string().nullable().optional(),
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
    teacher: teacherSchema.nullable().optional(),
    teachers: z.array(teacherSchema).optional(),
  }).passthrough(),
  enrollment: z.object({
    status: z.string(),
    progress: z.number().optional(),
    enrolled_at: nullableString,
    last_learned_at: nullableString,
    completed_at: nullableString,
  }).passthrough(),
  class: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    im_conversation_id: nullableString,
  }).passthrough().nullable().optional(),
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
  provider: z.enum(["aliyun", "tencent"]).optional(),
  media_id: z.union([z.string(), z.number()]),
  play_auth: z.string(),
  app_id: z.union([z.string(), z.number()]).nullable().optional(),
  expires_in: z.number().optional(),
}).passthrough();

export const coursewareSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: nullableString,
  lesson: z.object({
    id: z.number(),
    title: z.string().optional(),
  }).passthrough().nullable().optional(),
  original_name: nullableString,
  file_type: nullableString,
  file_size: nullableNumber,
  acquisition_type: z.string().optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  currency: nullableString,
  can_acquire: z.boolean().optional(),
  requires_purchase: z.boolean().optional(),
  download_url: nullableString,
}).passthrough();

export const coursewaresSchema = z.array(coursewareSchema);

export const courseCommentUserSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  nick_name: z.string().optional(),
  real_name: z.string().optional(),
  avatar: nullableString,
}).passthrough();

export const courseCommentSchema = z.object({
  id: z.number(),
  rating: z.coerce.number(),
  content: z.string(),
  is_anonymous: z.boolean().optional(),
  created_at: nullableString,
  updated_at: nullableString,
  user: courseCommentUserSchema.nullable().optional(),
}).passthrough();

export const courseCommentListSchema = z.object({
  summary: z.object({
    total: z.number().optional(),
    count: z.number().optional(),
    average_rating: z.union([z.number(), z.string()]).nullable().optional(),
    avg_rating: z.union([z.number(), z.string()]).nullable().optional(),
  }).passthrough().optional(),
  comments: z.object({
    current_page: z.number(),
    data: z.array(courseCommentSchema),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number().optional(),
  }).passthrough(),
}).passthrough();

export const submitCourseCommentSchema = z.object({
  message: z.string().optional(),
  comment: courseCommentSchema.optional(),
}).passthrough();

export const courseInteractionSchema = z.object({
  favorite_count: z.number().optional(),
  like_count: z.number().optional(),
  share_count: z.number().optional(),
  favorited: z.boolean().optional(),
  liked: z.boolean().optional(),
  share_url: z.string().optional(),
}).passthrough();

export const myPracticeRecordSchema = z.object({
  id: z.number(),
  attempt_no: z.number(),
  status: z.string(),
  score: nullableNumber,
  correct_count: z.number(),
  answered_count: z.number(),
  started_at: nullableString,
  completed_at: nullableString,
  practice: z.object({
    id: z.number(),
    title: z.string(),
    description: nullableString,
    status: z.string(),
    question_count: z.number(),
    total_score: z.number(),
    show_answer_immediately: z.boolean(),
    course: z.object({
      id: z.number(),
      title: z.string(),
      slug: z.string(),
    }).nullable().optional(),
    lesson: z.object({
      id: z.number(),
      title: z.string(),
    }).nullable().optional(),
    chapter: z.object({
      id: z.number(),
      title: z.string(),
    }).nullable().optional(),
  }).nullable().optional(),
});

export type MyPracticeRecord = z.infer<typeof myPracticeRecordSchema>;

export type LearnLesson = z.infer<typeof learnLessonSchema>;
export type CourseLearn = z.infer<typeof courseLearnSchema>;
export type LiveSessionPayload = z.infer<typeof liveSessionSchema>;
export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export type LessonLiveSession = z.infer<typeof lessonLiveSessionSchema>;
export type VodPlayAuth = z.infer<typeof vodPlayAuthSchema>;
export type Courseware = z.infer<typeof coursewareSchema>;
export type CourseComment = z.infer<typeof courseCommentSchema>;
export type CourseCommentList = z.infer<typeof courseCommentListSchema>;
export type CourseInteraction = z.infer<typeof courseInteractionSchema>;
