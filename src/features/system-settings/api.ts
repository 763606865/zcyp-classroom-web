import { systemSettingsSchema, type SystemSettings } from "@/entities/system";
import { apiClient } from "@/lib/http";

export function getSystemSettings() {
  return apiClient.get<SystemSettings>("/api/system/settings", {
    responseSchema: systemSettingsSchema,
  });
}
