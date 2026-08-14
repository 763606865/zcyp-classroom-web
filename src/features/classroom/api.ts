import { z } from "zod";
import {
  classroomHomeSchema,
  paginatedSchema,
  trainingCardSchema,
  trainingDetailSchema,
  type ClassroomHome,
  type TrainingCard,
  type TrainingDetail,
} from "@/entities/classroom";
import { apiClient } from "@/lib/http";

const trainingListSchema = paginatedSchema(trainingCardSchema);
type TrainingList = z.infer<typeof trainingListSchema>;

export interface TrainingListQuery {
  q?: string;
  type?: string;
  category?: string;
  featured?: boolean;
  per_page?: number;
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

export type { TrainingCard, TrainingDetail, ClassroomHome };
