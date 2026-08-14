import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/http";

export function applyApiFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  if (!isApiError(error) || !error.errors) return false;
  for (const [field, messages] of Object.entries(error.errors)) {
    const message = messages[0];
    if (message) setError(field as FieldPath<T>, { type: "server", message });
  }
  return true;
}

export function getApiErrorMessage(error: unknown, fallback = "操作失败，请稍后重试"): string {
  return isApiError(error) ? error.message : fallback;
}
