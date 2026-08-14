import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  real_name: z.string().nullable(),
  nick_name: z.string().nullable(),
  phone: z.string(),
  avatar: z.string().nullable(),
  gender: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  email: z.string().nullable().optional(),
  status: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof userSchema>;
