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
  teacher: teacherSchema.nullable().optional(),
});

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
});

export const trainingDetailSchema = trainingCardSchema.extend({
  description: nullableString,
  view_count: z.number().optional(),
  enrolled: z.boolean().optional(),
  teachers: z.array(teacherSchema).optional(),
  courses: z.array(courseCardSchema).optional(),
});

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

export const myExamSchema = z.object({
  id: z.number(),
  attempt_no: z.number().optional(),
  status: z.string(),
  score: nullableNumber,
  is_passed: z.boolean().nullable().optional(),
  correct_count: nullableNumber,
  answered_count: nullableNumber,
  started_at: nullableString,
  submitted_at: nullableString,
  exam: z.object({
    id: z.number(),
    title: z.string(),
    status: z.string().optional(),
    total_score: nullableNumber,
    pass_score: nullableNumber,
    duration_minutes: nullableNumber,
    start_at: nullableString,
    end_at: nullableString,
  }),
});

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
export type TrainingDetail = z.infer<typeof trainingDetailSchema>;
export type ClassroomHome = z.infer<typeof classroomHomeSchema>;
export type MyCourse = z.infer<typeof myCourseSchema>;
export type MyTraining = z.infer<typeof myTrainingSchema>;
export type MyClass = z.infer<typeof myClassSchema>;
export type MyExam = z.infer<typeof myExamSchema>;
export type MyFavoriteItem = z.infer<typeof myFavoriteItemSchema>;
export type Order = z.infer<typeof orderSchema>;
