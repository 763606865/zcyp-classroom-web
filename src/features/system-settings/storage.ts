import { systemSettingsSchema, type SystemSettings } from "@/entities/system";
import { createBrowserStorage } from "@/lib/storage";

const SETTINGS_KEY = "caiyun.system-settings";
const storage = createBrowserStorage(SETTINGS_KEY);

export function readCachedSystemSettings(): SystemSettings | null {
  const raw = storage.get();
  if (!raw) return null;
  try {
    return systemSettingsSchema.parse(JSON.parse(raw));
  } catch {
    storage.remove();
    return null;
  }
}

export function writeCachedSystemSettings(settings: SystemSettings): void {
  storage.set(JSON.stringify(settings));
}
