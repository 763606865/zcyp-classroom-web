"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { logger } from "@/lib/logger";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error("Route rendering failed", { error, digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center px-6 py-16">
      <EmptyState
        title="页面暂时无法显示"
        description="我们已经记录了这个问题，请稍后重试。"
        action={<Button onClick={unstable_retry}>重新加载</Button>}
      />
    </main>
  );
}
