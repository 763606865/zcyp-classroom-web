"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

export function LoginHeader() {
  const { settings } = useSystemSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-base font-semibold text-primary">
          {settings?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo} alt="" className="h-8 w-auto max-w-32 object-contain" />
          ) : null}
        </Link>
        <Link href="/consult?source=login">
          <button
            type="button"
            className="inline-flex items-center gap-[2px] rounded bg-[#0F62FE] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0F62FE]/90"
            style={{ height: 32, padding: "8px 16px", fontSize: 14, borderRadius: 4 }}
          >
            <MessageSquare style={{ width: 16, height: 16 }} />
            <span>立即咨询</span>
          </button>
        </Link>
      </div>
    </header>
  );
}
