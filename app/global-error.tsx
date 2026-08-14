"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error("Application rendering failed", { error, digest: error.digest });
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <main style={{ margin: "10vh auto", maxWidth: 560, padding: 24, textAlign: "center" }}>
          <h1>应用暂时不可用</h1>
          <p>发生了无法恢复的错误，请重新加载应用。</p>
          <button type="button" onClick={unstable_retry}>
            重新加载
          </button>
        </main>
      </body>
    </html>
  );
}
