"use client";

import Link from "next/link";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

export function HomeSideDock() {
  const { settings } = useSystemSettings();

  return (
    <aside className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg sm:flex">
      <Link href="/consult?source=homepage" className="px-3 py-3 text-center text-xs text-primary hover:bg-muted">咨询</Link>
      {settings?.customer_service_phone ? (
        <a href={`tel:${settings.customer_service_phone}`} className="border-t border-border px-3 py-3 text-center text-xs hover:bg-muted">电话</a>
      ) : null}
      <a href="#top" className="border-t border-border px-3 py-3 text-center text-xs hover:bg-muted">顶部</a>
    </aside>
  );
}
