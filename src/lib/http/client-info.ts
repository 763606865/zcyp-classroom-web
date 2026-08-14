import { publicEnv } from "@/config/env";
import { createBrowserStorage } from "@/lib/storage";
import { createUuid } from "@/lib/uuid";
import type { ClientInfo } from "./types";

const DEVICE_ID_STORAGE_KEY = "caiyun.device-id";
const deviceIdStorage = createBrowserStorage(DEVICE_ID_STORAGE_KEY);

function getBrowserDeviceId(): string {
  const current = deviceIdStorage.get();
  if (current) return current;
  const deviceId = createUuid();
  deviceIdStorage.set(deviceId);
  return deviceId;
}

export function getWebClientInfo(): ClientInfo {
  if (typeof window === "undefined") {
    throw new Error("服务端请求必须显式提供 clientInfo");
  }

  return {
    clientType: "web",
    appVersion: publicEnv.NEXT_PUBLIC_APP_VERSION,
    appBuild: publicEnv.NEXT_PUBLIC_APP_BUILD,
    platform: "web",
    osVersion: window.navigator.platform || "web",
    deviceId: getBrowserDeviceId(),
    channel: publicEnv.NEXT_PUBLIC_APP_CHANNEL,
  };
}

export function createClientHeaders(
  clientInfo: ClientInfo,
  requestId: string,
): Record<string, string> {
  return {
    "X-Client-Type": clientInfo.clientType,
    "X-App-Version": clientInfo.appVersion,
    "X-App-Build": clientInfo.appBuild,
    "X-Platform": clientInfo.platform,
    "X-OS-Version": clientInfo.osVersion,
    "X-Device-ID": clientInfo.deviceId,
    "X-Channel": clientInfo.channel,
    "X-Request-ID": requestId,
  };
}
