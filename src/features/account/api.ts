import { z } from "zod";
import {
  myClassSchema,
  myCourseSchema,
  myExamSchema,
  myFavoriteItemSchema,
  myHomeworkSchema,
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

export function getMyExams(params?: { status?: string; per_page?: number; page?: number }) {
  return apiClient.get<z.infer<typeof myExamsSchema>>("/api/me/exams", {
    query: { status: params?.status, per_page: params?.per_page ?? 15, page: params?.page },
    responseSchema: myExamsSchema,
    retry: 0,
  });
}

export function getExamDetail(examId: number) {
  return apiClient.get<z.infer<typeof myExamSchema>>(`/api/me/exams/${examId}`, {
    responseSchema: myExamSchema,
    retry: 0,
  });
}

export function startExam(examId: number) {
  return apiClient.post<z.infer<typeof myExamSchema>>(`/api/me/exams/${examId}/start`, {}, {
    responseSchema: myExamSchema,
    retry: 0,
  });
}

export function saveExamAnswer(
  examId: number,
  body: {
    answers?: Array<{ question_id: number; answer: string[] }>;
    submit: boolean;
  },
) {
  return apiClient.put<z.infer<typeof myExamSchema>>(
    `/api/me/exams/${examId}/answer`,
    body,
    { responseSchema: myExamSchema, retry: 0 },
  );
}

const myHomeworksSchema = paginatedSchema(myHomeworkSchema);

export function getMyHomeworks(params?: { status?: string; per_page?: number; page?: number }) {
  return apiClient.get<z.infer<typeof myHomeworksSchema>>("/api/me/homeworks", {
    query: { status: params?.status, per_page: params?.per_page ?? 15, page: params?.page },
    responseSchema: myHomeworksSchema,
    retry: 0,
  });
}

export function getHomeworkDetail(homeworkId: number) {
  return apiClient.get<z.infer<typeof myHomeworkSchema>>(`/api/me/homeworks/${homeworkId}`, {
    responseSchema: myHomeworkSchema,
    retry: 0,
  });
}

export function startHomework(homeworkId: number) {
  return apiClient.post<z.infer<typeof myHomeworkSchema>>(`/api/me/homeworks/${homeworkId}/start`, {}, {
    responseSchema: myHomeworkSchema,
    retry: 0,
  });
}

export function saveHomeworkAnswer(
  homeworkId: number,
  body: {
    attachment_urls?: string[];
    answers?: Array<{ question_id: number; answer: string[] }>;
    submit: boolean;
  },
) {
  return apiClient.put<z.infer<typeof myHomeworkSchema>>(
    `/api/me/homeworks/${homeworkId}/answer`,
    body,
    { responseSchema: myHomeworkSchema, retry: 0 },
  );
}
