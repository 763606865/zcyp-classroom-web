import { publicEnv } from "@/config/env";
import type { VodPlayAuth } from "@/entities/learn";

function mediaIdOf(auth: VodPlayAuth) {
  return String(auth.media_id);
}

function appIdOf(auth: VodPlayAuth) {
  return auth.app_id == null || auth.app_id === "" ? "" : String(auth.app_id);
}

export function tencentVodDomain() {
  const raw = publicEnv.NEXT_PUBLIC_TENCENT_VOD_DOMAIN?.trim() ?? "";
  return raw.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function applyVodDomain(src: string, domain: string) {
  if (!domain) return src;
  const url = new URL(src);
  url.protocol = "https:";
  url.host = domain;
  return url.toString();
}

function collectPlayUrls(value: unknown, out: string[]) {
  if (typeof value === "string" && /^https?:\/\//i.test(value) && /\.(m3u8|mp4)(\?|$)/i.test(value)) {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPlayUrls(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectPlayUrls(item, out);
  }
}

function pickPlayUrl(urls: string[]) {
  const unique = [...new Set(urls)];
  return unique.find((url) => url.includes(".m3u8")) ?? unique.find((url) => url.includes(".mp4")) ?? unique[0] ?? "";
}

export async function resolveTencentVodUrl(auth: VodPlayAuth) {
  const appId = appIdOf(auth);
  const fileId = mediaIdOf(auth);
  if (!appId || !fileId || !auth.play_auth) return "";

  const endpoint = `https://playvideo.qcloud.com/getplayinfo/v4/${encodeURIComponent(appId)}/${encodeURIComponent(fileId)}?psign=${encodeURIComponent(auth.play_auth)}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`点播播放信息获取失败（${response.status}）`);
  const payload = await response.json() as { code?: number; message?: string };
  if (typeof payload.code === "number" && payload.code !== 0) {
    throw new Error(payload.message || "点播播放信息获取失败");
  }

  const urls: string[] = [];
  collectPlayUrls(payload, urls);
  const picked = pickPlayUrl(urls);
  if (!picked) throw new Error("点播未返回可播放地址");
  return applyVodDomain(picked, tencentVodDomain());
}
