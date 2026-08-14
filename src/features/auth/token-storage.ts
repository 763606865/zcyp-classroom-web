import { createBrowserStorage } from "@/lib/storage";

const TOKEN_KEY = "caiyun.auth-token";

export type { BrowserStorage as TokenStorage } from "@/lib/storage";
export const browserTokenStorage = createBrowserStorage(TOKEN_KEY);
