import { z } from "zod";
import { userSchema, type User } from "@/entities/user";
import { apiClient } from "@/lib/http";

export interface UpdateProfileInput {
  real_name?: string | null;
  nick_name?: string | null;
  avatar?: string | null;
  gender?: 0 | 1 | 2 | null;
  email?: string | null;
}

const userResponseSchema = z.object({ message: z.string(), user: userSchema });
const smsResponseSchema = z.object({ message: z.string(), expires_in: z.number() });

export function updateProfile(input: UpdateProfileInput) {
  return apiClient.patch<{ message: string; user: User }>("/api/user", { ...input }, { responseSchema: userResponseSchema });
}

export function sendChangePhoneSmsCode(phone: string) {
  return apiClient.post("/api/user/phone/sms-code", { phone }, { responseSchema: smsResponseSchema });
}

export function changePhone(phone: string, code: string) {
  return apiClient.patch<{ message: string; user: User }>("/api/user/phone", { phone, code }, { responseSchema: userResponseSchema });
}
