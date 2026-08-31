export type LivePlayUrls = {
  webrtc?: string | null;
  flv?: string | null;
  hls?: string | null;
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

/** 直播线路：WebRTC > FLV > HLS。iOS 上跳过 FLV，避免选到无法播放的地址。 */
export function pickLivePlayLine(playUrls?: LivePlayUrls | null) {
  const webrtc = firstNonEmpty(playUrls?.webrtc);
  const flv = firstNonEmpty(playUrls?.flv);
  const hls = firstNonEmpty(playUrls?.hls);
  const usableFlv = flv && canPlayFlv() ? flv : "";
  const src = webrtc || usableFlv || hls || flv;
  let fallbackUrl = "";
  if (src && src === webrtc) fallbackUrl = usableFlv || hls;
  else if (src && src === usableFlv) fallbackUrl = hls;
  return { src, fallbackUrl };
}
