import { z } from "zod";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

export const teacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  title: nullableString,
  avatar: nullableString,
  organization: nullableString,
  expertise: nullableString,
});

export const bannerSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: nullableString,
  slug: z.string(),
  cover: nullableString,
  summary: nullableString,
  external_url: nullableString,
});

export const courseCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: nullableString,
  slug: z.string(),
  cover: nullableString,
  summary: nullableString,
  type: z.string(),
  status: z.string().optional(),
  is_free: z.boolean(),
  price: z.string(),
  is_featured: z.boolean().optional(),
  duration_minutes: nullableNumber,
  lesson_count: nullableNumber,
  favorite_count: nullableNumber,
  like_count: nullableNumber,
  share_count: nullableNumber,
  teacher: teacherSchema.nullable().optional(),
}).passthrough();

export const trainingCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: nullableString,
  slug: z.string(),
  cover: nullableString,
  summary: nullableString,
  type: z.string(),
  status: z.string(),
  location: nullableString,
  start_at: nullableString,
  end_at: nullableString,
  enroll_start_at: nullableString,
  enroll_end_at: nullableString,
  max_students: nullableNumber,
  enroll_count: z.number().optional(),
  is_free: z.boolean(),
  price: z.string(),
  is_featured: z.boolean().optional(),
  category: categorySchema.nullable().optional(),
}).passthrough();

export const teacherProfileSchema = teacherSchema.extend({
  bio: nullableString,
  sort: z.number().optional(),
  courses: z.array(courseCardSchema).optional(),
  trainings: z.array(trainingCardSchema).optional(),
}).passthrough();

export const classScheduleSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: nullableString,
  cover: nullableString,
  description: nullableString,
  status: z.string(),
  student_count: z.number().optional(),
  max_students: nullableNumber,
  start_at: nullableString,
  end_at: nullableString,
  teacher: teacherSchema.nullable().optional(),
  training: trainingCardSchema.nullable().optional(),
}).passthrough();

export const liveSessionSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: nullableString,
  scheduled_start_at: nullableString,
  scheduled_end_at: nullableString,
  has_playback: z.boolean().optional(),
}).passthrough();

export const courseLessonSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.string().optional(),
  summary: nullableString,
  duration_seconds: z.number().optional(),
  is_free_preview: z.boolean().optional(),
  sort: z.number().optional(),
  live_sessions: z.array(liveSessionSchema).optional(),
}).passthrough();

export const courseChapterSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: nullableString,
  sort: z.number().optional(),
  lessons: z.array(courseLessonSchema).optional(),
}).passthrough();

export const courseDetailSchema = courseCardSchema.extend({
  description: nullableString,
  enroll_count: z.number().optional(),
  view_count: z.number().optional(),
  enrolled: z.boolean().optional(),
  favorited: z.boolean().optional(),
  liked: z.boolean().optional(),
  category: categorySchema.nullable().optional(),
  chapters: z.array(courseChapterSchema).optional(),
  ungrouped_lessons: z.array(courseLessonSchema).optional(),
}).passthrough();

export const trainingCourseSchema = courseCardSchema.extend({
  teacher: teacherSchema.nullable().optional(),
  chapters: z.array(courseChapterSchema).optional(),
  ungrouped_lessons: z.array(courseLessonSchema).optional(),
}).passthrough();

export const trainingDetailSchema = trainingCardSchema.extend({
  description: nullableString,
  view_count: z.number().optional(),
  enrolled: z.boolean().optional(),
  teachers: z.array(teacherSchema).optional(),
  courses: z.array(trainingCourseSchema).optional(),
}).passthrough();

export const classroomHomeSchema = z.object({
  banners: z.array(bannerSchema),
  featured_trainings: z.array(trainingCardSchema),
  latest_trainings: z.array(trainingCardSchema),
  featured_courses: z.array(courseCardSchema),
});

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    current_page: z.number(),
    data: z.array(itemSchema),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number().optional(),
  });
}

export const myCourseSchema = z.object({
  id: z.number(),
  status: z.string(),
  source: z.string().optional(),
  progress: z.number().optional(),
  enrolled_at: nullableString,
  last_learned_at: nullableString,
  completed_at: nullableString,
  course: courseCardSchema,
});

export const myTrainingSchema = z.object({
  id: z.number(),
  status: z.string(),
  paid_amount: z.string().optional(),
  order_no: nullableString,
  enrolled_at: nullableString,
  completed_at: nullableString,
  training: trainingCardSchema,
});

export const myClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: nullableString,
  cover: nullableString,
  status: z.string(),
  start_at: nullableString,
  end_at: nullableString,
  role: z.string().optional(),
  member_status: z.string().optional(),
  joined_at: nullableString,
  training: z.object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),
  }).nullable().optional(),
  teacher: teacherSchema.nullable().optional(),
});

export const myFavoriteItemSchema = z.object({
  id: z.number(),
  type: z.string(),
  favorited_at: nullableString,
  course: courseCardSchema.passthrough().nullable().optional(),
  training: trainingCardSchema.extend({
    class: z.object({
      id: z.number(),
      name: z.string(),
      code: nullableString,
      status: z.string().optional(),
      student_count: z.number().optional(),
      max_students: nullableNumber,
    }).passthrough().nullable().optional(),
  }).passthrough().nullable().optional(),
}).passthrough();

const homeworkRelationSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
}).passthrough();

export const homeworkQuestionSchema = z.object({
  id: z.number(),
  type: z.string(),
  stem: z.string(),
  options: z.array(z.object({
    key: z.union([z.string(), z.number()]).transform(String),
    text: z.string().optional(),
    content: z.string().optional(),
  }).passthrough()).optional(),
  score: nullableNumber,
  sort: z.number().optional(),
  user_answer: z.array(z.string()).nullable().optional(),
  is_correct: z.boolean().nullable().optional(),
  earned_score: nullableNumber,
  correct_answer: z.array(z.string()).nullable().optional(),
  analysis: nullableString,
}).passthrough();

export const examAttemptSchema = z.object({
  id: z.number(),
  attempt_no: z.number().optional(),
  status: z.string(),
  score: nullableNumber,
  is_passed: z.boolean().nullable().optional(),
  correct_count: nullableNumber,
  answered_count: nullableNumber,
  started_at: nullableString,
  submitted_at: nullableString,
  scored_at: nullableString,
}).passthrough();

export const myExamSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: nullableString,
  status: z.string(),
  question_count: nullableNumber,
  total_score: nullableNumber,
  pass_score: nullableNumber,
  duration_minutes: nullableNumber,
  attempt_limit: z.number().optional(),
  show_answer_after_submit: z.boolean().optional(),
  start_at: nullableString,
  end_at: nullableString,
  progress_status: z.string(),
  attempts_used: z.number().optional(),
  can_start: z.boolean().optional(),
  can_edit: z.boolean().optional(),
  training: homeworkRelationSchema.nullable().optional(),
  course: homeworkRelationSchema.nullable().optional(),
  class: homeworkRelationSchema.nullable().optional(),
  attempt: examAttemptSchema.nullable().optional(),
  questions: z.array(homeworkQuestionSchema).optional(),
}).passthrough();

export const homeworkSubmissionSummarySchema = z.object({
  id: z.number(),
  content: nullableString,
  attachment_urls: z.array(z.string()).optional(),
  answers: z.array(z.object({
    question_id: z.number(),
    answer: z.array(z.string()),
  }).passthrough()).optional(),
  status: z.string(),
  score: nullableNumber,
  feedback: nullableString,
  submitted_at: nullableString,
  reviewed_at: nullableString,
  can_edit: z.boolean().optional(),
}).passthrough();

export const myHomeworkSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: nullableString,
  status: z.string(),
  question_count: nullableNumber,
  total_score: nullableNumber,
  start_at: nullableString,
  deadline_at: nullableString,
  allow_late: z.boolean().optional(),
  attachment_urls: z.array(z.string()).optional(),
  progress_status: z.string(),
  can_start: z.boolean().optional(),
  can_edit: z.boolean().optional(),
  training: homeworkRelationSchema.nullable().optional(),
  course: homeworkRelationSchema.nullable().optional(),
  class: homeworkRelationSchema.nullable().optional(),
  lesson: homeworkRelationSchema.nullable().optional(),
  submission: homeworkSubmissionSummarySchema.nullable().optional(),
  questions: z.array(homeworkQuestionSchema).optional(),
  reviewer: z.object({
    id: z.number(),
    name: z.string().optional(),
  }).passthrough().nullable().optional(),
}).passthrough();

export const orderSchema = z.object({
  id: z.number(),
  order_no: z.string(),
  title: z.string().optional(),
  amount: z.string(),
  paid_amount: z.string().optional(),
  status: z.string(),
  channel: z.string().nullable().optional(),
  trade_no: nullableString,
  payable_type: z.string().optional(),
  payable_id: z.number().optional(),
  paid_at: nullableString,
  expired_at: nullableString,
  created_at: nullableString,
  pay_payload: z.unknown().nullable().optional(),
});

export const createOrderResponseSchema = z.object({
  order: orderSchema,
  paid: z.boolean(),
});

export const payOrderResponseSchema = z.object({
  order: orderSchema.partial().extend({
    order_no: z.string(),
    status: z.string(),
  }),
  pay: z.object({
    channel: z.string(),
    status: z.string(),
    message: z.string().optional(),
  }).optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type Teacher = z.infer<typeof teacherSchema>;
export type Banner = z.infer<typeof bannerSchema>;
export type CourseCard = z.infer<typeof courseCardSchema>;
export type TrainingCard = z.infer<typeof trainingCardSchema>;
export type TrainingCourse = z.infer<typeof trainingCourseSchema>;
export type TrainingDetail = z.infer<typeof trainingDetailSchema>;
export type ClassroomHome = z.infer<typeof classroomHomeSchema>;
export type TeacherProfile = z.infer<typeof teacherProfileSchema>;
export type ClassSchedule = z.infer<typeof classScheduleSchema>;
export type MyCourse = z.infer<typeof myCourseSchema>;
export type MyTraining = z.infer<typeof myTrainingSchema>;
export type MyClass = z.infer<typeof myClassSchema>;
export type MyExam = z.infer<typeof myExamSchema>;
export type HomeworkQuestion = z.infer<typeof homeworkQuestionSchema>;
export type MyHomework = z.infer<typeof myHomeworkSchema>;
export type MyFavoriteItem = z.infer<typeof myFavoriteItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type LiveSession = z.infer<typeof liveSessionSchema>;
export type CourseLesson = z.infer<typeof courseLessonSchema>;
export type CourseChapter = z.infer<typeof courseChapterSchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;
