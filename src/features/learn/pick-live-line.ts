export type LivePlayUrls = {
  webrtc?: string | null;
  flv?: string | null;
  hls?: string | null;
};

export type LiveLineKind = "webrtc" | "flv" | "hls";

export type LivePlayLine = {
  kind: LiveLineKind;
  src: string;
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }
  return "";
}

function canPlayFlv() {
  if (typeof navigator === "undefined") return true;
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return false;
  return typeof MediaSource !== "undefined" || "ManagedMediaSource" in window;
}

/** 直播线路：WebRTC > FLV > HLS。iOS 上跳过 FLV。 */
export function orderedLiveLines(playUrls?: LivePlayUrls | null): LivePlayLine[] {
  const webrtc = firstNonEmpty(playUrls?.webrtc);
  const flv = firstNonEmpty(playUrls?.flv);
  const hls = firstNonEmpty(playUrls?.hls);
  const lines: LivePlayLine[] = [];
  if (webrtc) lines.push({ kind: "webrtc", src: webrtc });
  if (flv && canPlayFlv()) lines.push({ kind: "flv", src: flv });
  if (hls) lines.push({ kind: "hls", src: hls });
  return lines;
}
