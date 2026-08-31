import { z } from "zod";
import {
  myClassSchema,
  myCourseSchema,
  myExamSchema,
  myFavoriteItemSchema,
  myTrainingSchema,
  paginatedSchema,
} from "@/entities/classroom";
import { apiClient } from "@/lib/http";

const myFavoritesSchema = paginatedSchema(myFavoriteItemSchema);

export function getMyFavorites(params?: { type?: string; per_page?: number; page?: number }) {
  return apiClient.get<z.infer<typeof myFavoritesSchema>>("/api/me/favorites", {
    query: { type: params?.type, per_page: params?.per_page ?? 15, page: params?.page },
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
