import { z } from "zod";
import { apiClient } from "@/lib/http";

export type UploadDirectory = "avatar" | "image" | "document" | "other";

const uploadResponseSchema = z.object({
  message: z.string(),
  file: z.object({
    path: z.string(), url: z.url(), original_name: z.string(), mime_type: z.string(),
    extension: z.string(), size: z.number(),
  }),
});

export function uploadFile(file: File, directory: UploadDirectory = "other", signal?: AbortSignal) {
  const body = new FormData();
  body.set("file", file);
  body.set("directory", directory);
  return apiClient.post("/api/files/upload", body, { responseSchema: uploadResponseSchema, signal });
}
