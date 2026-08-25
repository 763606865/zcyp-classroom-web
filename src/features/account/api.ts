import { z } from "zod";
import {
  myClassSchema,
  myCourseSchema,
  myExamSchema,
  myTrainingSchema,
  paginatedSchema,
} from "@/entities/classroom";
import { myPracticeRecordSchema } from "@/entities/learn";
import { apiClient } from "@/lib/http";

const favoriteCourseSchema = z.object({
  id: z.number(),
  created_at: z.string().nullable().optional(),
  course: z.object({
    id: z.number(),
    title: z.string(),
  }).passthrough(),
}).passthrough();
const myFavoritesSchema = paginatedSchema(favoriteCourseSchema);

export function getMyCourseFavorites() {
  return apiClient.get<z.infer<typeof myFavoritesSchema>>("/api/me/course-favorites", {
    query: { per_page: 20 },
    responseSchema: myFavoritesSchema,
    retry: 0,
  });
}

const myCoursesSchema = paginatedSchema(myCourseSchema);
const myTrainingsSchema = paginatedSchema(myTrainingSchema);
const myClassesSchema = paginatedSchema(myClassSchema);
const myExamsSchema = paginatedSchema(myExamSchema);

export function getMyCourses(status?: string) {
  return apiClient.get<z.infer<typeof myCoursesSchema>>("/api/me/courses", {
    query: { status, per_page: 20 },
    responseSchema: myCoursesSchema,
    retry: 0,
  });
}

export function getMyTrainings(status?: string) {
  return apiClient.get<z.infer<typeof myTrainingsSchema>>("/api/me/trainings", {
    query: { status, per_page: 20 },
    responseSchema: myTrainingsSchema,
    retry: 0,
  });
}

export function getMyClasses(status?: string) {
  return apiClient.get<z.infer<typeof myClassesSchema>>("/api/me/classes", {
    query: { status, per_page: 20 },
    responseSchema: myClassesSchema,
    retry: 0,
  });
}

export function getMyExams(status?: string) {
  return apiClient.get<z.infer<typeof myExamsSchema>>("/api/me/exams", {
    query: { status, per_page: 20 },
    responseSchema: myExamsSchema,
    retry: 0,
  });
}

const myPracticesSchema = paginatedSchema(myPracticeRecordSchema);

export function getMyPractices(params?: { status?: string; per_page?: number; page?: number }) {
  return apiClient.get<z.infer<typeof myPracticesSchema>>("/api/me/practices", {
    query: { status: params?.status, per_page: params?.per_page ?? 15, page: params?.page },
    responseSchema: myPracticesSchema,
    retry: 0,
  });
}
