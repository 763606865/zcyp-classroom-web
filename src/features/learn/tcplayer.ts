const PLAYER_CSS = "https://web.sdk.qcloud.com/player/tcplayer/release/v5.3.2/tcplayer.min.css";
const HLS_JS = "https://web.sdk.qcloud.com/player/tcplayer/release/v5.3.2/libs/hls.min.1.1.5.js";
const PLAYER_JS = "https://web.sdk.qcloud.com/player/tcplayer/release/v5.3.2/tcplayer.v5.3.2.min.js";

export type TcPlayerInstance = {
  dispose: () => void;
  currentTime: (seconds?: number) => number | void;
  play?: () => Promise<void> | void;
  muted?: (value?: boolean) => boolean | void;
  loadVideoByID?: (options: { fileID: string; appID: string; psign: string }) => void;
  ready: (callback: () => void) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

type TcPlayerFactory = (id: string, options: Record<string, unknown>) => TcPlayerInstance;

declare global {
  interface Window {
    TCPlayer?: TcPlayerFactory;
  }
}

let loading: Promise<TcPlayerFactory> | undefined;

function appendStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true" || (src.includes("tcplayer") && window.TCPlayer)) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("腾讯云播放器脚本加载失败")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("腾讯云播放器脚本加载失败"));
    document.body.appendChild(script);
  });
}

export function loadTcPlayer(): Promise<TcPlayerFactory> {
  if (typeof window === "undefined") return Promise.reject(new Error("TCPlayer 仅可在浏览器中加载"));
  if (window.TCPlayer) return Promise.resolve(window.TCPlayer);
  if (loading) return loading;

  loading = (async () => {
    appendStylesheet(PLAYER_CSS);
    await loadScript(HLS_JS);
    await loadScript(PLAYER_JS);
    if (!window.TCPlayer) throw new Error("腾讯云播放器脚本加载失败");
    return window.TCPlayer;
  })().catch((error) => {
    loading = undefined;
    throw error;
  });

  return loading;
}
