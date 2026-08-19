const PLAYER_CSS = "https://g.alicdn.com/de/prismplayer/2.16.3/skins/default/aliplayer-min.css";
const PLAYER_JS = "https://g.alicdn.com/de/prismplayer/2.16.3/aliplayer-min.js";

export type AliplayerInstance = {
  dispose: () => void;
  getCurrentTime: () => number;
  seek: (seconds: number) => void;
  replayByVidAndPlayauth?: (vid: string, playauth: string) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

type AliplayerCtor = new (options: Record<string, unknown>, ready?: () => void) => AliplayerInstance;

declare global {
  interface Window {
    Aliplayer?: AliplayerCtor;
  }
}

let loading: Promise<AliplayerCtor> | undefined;

export function loadAliplayer(): Promise<AliplayerCtor> {
  if (typeof window === "undefined") return Promise.reject(new Error("Aliplayer 仅可在浏览器中加载"));
  if (window.Aliplayer) return Promise.resolve(window.Aliplayer);
  if (loading) return loading;

  loading = new Promise<AliplayerCtor>((resolve, reject) => {
    if (!document.querySelector(`link[href="${PLAYER_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = PLAYER_CSS;
      document.head.appendChild(link);
    }

    const onReady = () => {
      if (window.Aliplayer) resolve(window.Aliplayer);
      else reject(new Error("阿里云播放器脚本加载失败"));
    };
    if (window.Aliplayer) {
      resolve(window.Aliplayer);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PLAYER_JS}"]`);
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("阿里云播放器脚本加载失败")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = PLAYER_JS;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("阿里云播放器脚本加载失败"));
    document.body.appendChild(script);
  }).catch((error) => {
    loading = undefined;
    throw error;
  });

  return loading;
}
