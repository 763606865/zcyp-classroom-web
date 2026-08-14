import { z } from "zod";
import { userSchema, type User } from "@/entities/user";
import { apiClient } from "@/lib/http";
const smsCodeResponseSchema = z.object({ message: z.string(), expires_in: z.number() });
const loginResponseSchema = z.object({ token_type: z.literal("Bearer"), access_token: z.string().min(1), user: userSchema });
const meResponseSchema = z.object({ user: userSchema });

export function sendLoginSmsCode(phone: string) {
  return apiClient.post<{ message: string; expires_in: number }>("/api/auth/sms-code", { phone }, { responseSchema: smsCodeResponseSchema });
}

export function loginWithSms(phone: string, code: string) {
  return apiClient.post<{ token_type: "Bearer"; access_token: string; user: User }>("/api/auth/login", { phone, code, device_name: "web" }, { responseSchema: loginResponseSchema });
}

export function getCurrentUser(token?: string) {
  return apiClient.get<{ user: User }>("/api/me", { token, responseSchema: meResponseSchema, retry: 0 });
}
