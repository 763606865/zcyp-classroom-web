import { z } from "zod";
import { apiClient } from "@/lib/http";

const versionCheckSchema = z.object({
  has_update: z.boolean(), force_update: z.boolean(),
  update_type: z.enum(["none", "optional", "force"]),
  latest_version: z.object({
    app_version: z.string(), app_build: z.string(), min_supported_version: z.string().nullable(),
    min_supported_build: z.string().nullable(), download_url: z.string().nullable(),
    release_notes: z.string().nullable(), published_at: z.string(),
  }).nullable(),
});

export function checkClientVersion() {
  return apiClient.get("/api/client/version/check", { responseSchema: versionCheckSchema });
}
