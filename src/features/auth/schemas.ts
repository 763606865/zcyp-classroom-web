import { z } from "zod";

export const phoneSchema = z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入正确的中国大陆手机号");
export const smsCodeSchema = z.string().trim().regex(/^\d{6}$/, "请输入 6 位验证码");

export const smsLoginSchema = z.object({
  phone: phoneSchema,
  code: smsCodeSchema,
});

export type SmsLoginValues = z.infer<typeof smsLoginSchema>;
