import { z } from "zod";
import { userSchema, type User } from "@/entities/user";
import { imConfigSchema, type ImConfig } from "@/entities/im";
import { apiClient } from "@/lib/http";
const smsCodeResponseSchema = z.object({ message: z.string(), expires_in: z.number() });
const loginResponseSchema = z.object({
  token_type: z.literal("Bearer"),
  access_token: z.string().min(1),
  user: userSchema,
  im: imConfigSchema.optional(),
});
const meResponseSchema = z.object({ user: userSchema, im: imConfigSchema.optional() });
const ecosystemTicketSchema = z.object({ ticket: z.string().min(1) });

export function sendLoginSmsCode(phone: string) {
  return apiClient.post<{ message: string; expires_in: number }>("/api/auth/sms-code", { phone }, { responseSchema: smsCodeResponseSchema });
}

export function loginWithSms(phone: string, code: string) {
  return apiClient.post<{ token_type: "Bearer"; access_token: string; user: User; im?: ImConfig }>("/api/auth/login", { phone, code, device_name: "web" }, { responseSchema: loginResponseSchema });
}

export function exchangeEcosystemTicket(ticket: string) {
  return apiClient.post<{ token_type: "Bearer"; access_token: string; user: User; im?: ImConfig }>(
    "/api/auth/ecosystem/ticket/exchange",
    { ticket, device_name: "web" },
    { responseSchema: loginResponseSchema, token: "", retry: 0 },
  );
}

export function getCurrentUser(token?: string) {
  return apiClient.get<{ user: User; im?: ImConfig }>("/api/me", { token, responseSchema: meResponseSchema, retry: 0 });
}

export function getEcosystemTicket(targetAppCode: string) {
  return apiClient.post<{ ticket: string }>(
    "/api/auth/ecosystem/ticket",
    { target_app_code: targetAppCode },
    { responseSchema: ecosystemTicketSchema, retry: 0 },
  );
}
