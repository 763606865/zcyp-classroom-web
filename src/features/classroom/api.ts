import { z } from "zod";
import {
  classScheduleSchema,
  classroomHomeSchema,
  courseCardSchema,
  courseDetailSchema,
  paginatedSchema,
  teacherProfileSchema,
  trainingCardSchema,
  trainingDetailSchema,
  type ClassroomHome,
  type TrainingCard,
  type TrainingDetail,
} from "@/entities/classroom";
import { apiClient } from "@/lib/http";

const trainingListSchema = paginatedSchema(trainingCardSchema);
const hotCourseListSchema = paginatedSchema(courseCardSchema);
const classScheduleListSchema = paginatedSchema(classScheduleSchema);
const teacherListSchema = paginatedSchema(teacherProfileSchema);
type TrainingList = z.infer<typeof trainingListSchema>;

export interface TrainingListQuery {
  q?: string;
  type?: string;
  category?: string;
  featured?: boolean;
  per_page?: number;
  page?: number;
}

export interface HotCourseQuery {
  q?: string;
  type?: string;
  featured?: boolean;
  per_page?: number;
  page?: number;
}

export interface ClassScheduleQuery {
  q?: string;
  status?: string;
  per_page?: number;
  page?: number;
}

export interface TeacherListQuery {
  q?: string;
  per_page?: number;
  page?: number;
}

export function getClassroomHome() {
  return apiClient.get<ClassroomHome>("/api/classroom/home", {
    responseSchema: classroomHomeSchema,
  });
}

export function getTrainings(query: TrainingListQuery = {}) {
  return apiClient.get<TrainingList>("/api/classroom/trainings", {
    query: {
      q: query.q,
      type: query.type,
      category: query.category,
      featured: query.featured,
      per_page: query.per_page ?? 12,
      page: query.page ?? 1,
    },
    responseSchema: trainingListSchema,
  });
}

export function getTraining(slug: string) {
  return apiClient.get<TrainingDetail>(`/api/classroom/trainings/${encodeURIComponent(slug)}`, {
    responseSchema: trainingDetailSchema,
    retry: 0,
  });
}

export function getHotCourses(query: HotCourseQuery = {}) {
  return apiClient.get<z.infer<typeof hotCourseListSchema>>("/api/classroom/hot-courses", {
    query: {
      q: query.q,
      type: query.type,
      featured: query.featured ? true : undefined,
      per_page: query.per_page ?? 12,
      page: query.page,
    },
    responseSchema: hotCourseListSchema,
  });
}

export function getClassSchedules(query: ClassScheduleQuery = {}) {
  return apiClient.get<z.infer<typeof classScheduleListSchema>>("/api/classroom/class-schedules", {
    query: {
      q: query.q,
      status: query.status,
      per_page: query.per_page ?? 12,
      page: query.page,
    },
    responseSchema: classScheduleListSchema,
  });
}

export function getTeachers(query: TeacherListQuery = {}) {
  return apiClient.get<z.infer<typeof teacherListSchema>>("/api/classroom/teachers", {
    query: {
      q: query.q,
      per_page: query.per_page ?? 12,
      page: query.page,
    },
    responseSchema: teacherListSchema,
  });
}

export function getTeacher(id: number) {
  return apiClient.get<z.infer<typeof teacherProfileSchema>>(`/api/classroom/teachers/${id}`, {
    responseSchema: teacherProfileSchema,
    retry: 0,
  });
}

export function getCourseDetail(id: number) {
  return apiClient.get<z.infer<typeof courseDetailSchema>>(`/api/classroom/courses/${id}`, {
    responseSchema: courseDetailSchema,
    retry: 0,
  });
}

export type { TrainingCard, TrainingDetail, ClassroomHome };
