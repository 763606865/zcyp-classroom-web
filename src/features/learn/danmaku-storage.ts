import { createBrowserStorage } from "@/lib/storage/browser-storage";

export const danmakuEnabledStorage = createBrowserStorage<"true" | "false">("classroom.danmaku.enabled");

export function readDanmakuEnabled() {
  return danmakuEnabledStorage.get() !== "false";
}
