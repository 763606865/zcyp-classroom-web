"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { AuthEntry } from "@/features/auth/auth-entry";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const { settings, siteName } = useSystemSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      {settings?.maintenance_message ? (
        <p className="bg-muted px-6 py-2 text-center text-sm">{settings.maintenance_message}</p>
      ) : null}
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-base font-semibold text-primary">
          {settings?.logo ? (
            // 站点 Logo 来自后端公开 URL。
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo} alt="" className="h-8 w-auto max-w-32 object-contain" />
          ) : null}
          <span className="truncate">{siteName}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm lg:flex" aria-label="主导航">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:text-primary",
                pathname === item.href ? "font-medium text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          {settings?.customer_service_phone ? (
            <a href={`tel:${settings.customer_service_phone}`} className="hidden text-sm font-medium text-primary md:inline">
              {settings.customer_service_phone}
            </a>
          ) : null}
          <Link href="/consult?source=header" className="hidden sm:inline"><Button variant="accent">立即咨询</Button></Link>
          <AuthEntry />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { settings, siteName } = useSystemSettings();
  return (
    <footer className="mt-auto bg-[#0b1f44] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-6 px-6 py-10 text-sm">
        <div>
          <p className="text-base font-semibold">{siteName}</p>
          {settings?.customer_service_phone ? <p className="mt-2">热线 {settings.customer_service_phone}</p> : null}
        </div>
        <p className="max-w-sm text-white/70">计量检测岗位培训服务，课程内容以后台发布为准。</p>
        <div className="text-white/70">
          {settings?.icp_number ? <p>{settings.icp_number}</p> : null}
        </div>
      </div>
    </footer>
  );
}
