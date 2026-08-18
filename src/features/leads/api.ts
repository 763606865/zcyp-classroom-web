import { z } from "zod";
import { apiClient } from "@/lib/http";

export interface CreateLeadInput {
  name: string;
  phone: string;
  city: string;
  course_id?: number;
  intended_course?: string;
  source?: string;
}

const createLeadResponseSchema = z.object({
  message: z.string(),
  lead_id: z.number(),
});

export function createLead(input: CreateLeadInput) {
  return apiClient.post<{ message: string; lead_id: number }>("/api/classroom/leads", { ...input }, {
    responseSchema: createLeadResponseSchema,
    retry: 0,
  });
}
