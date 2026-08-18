import { z } from "zod";

const nullableString = z.string().nullable();

export const systemSettingsSchema = z.object({
  site_name: nullableString,
  logo: nullableString,
  favicon: nullableString,
  customer_service_phone: nullableString,
  icp_number: nullableString,
  sms_enabled: z.boolean(),
  registration_enabled: z.boolean(),
  default_avatar: nullableString,
  upload_max_size_mb: z.number(),
  payment_enabled: z.boolean(),
  maintenance_message: nullableString,
});

export type SystemSettings = z.infer<typeof systemSettingsSchema>;
