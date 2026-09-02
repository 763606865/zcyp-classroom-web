"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthEntry } from "@/features/auth/auth-entry";
import { EcosystemNavLink } from "@/features/auth/ecosystem-nav-link";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

const navLinkClass = "text-sm text-muted-foreground transition hover:text-primary";
const navActiveClass = "font-medium text-primary";

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { settings, siteName } = useSystemSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur">
      {settings?.maintenance_message ? (
        <p className="bg-muted px-6 py-2 text-center text-sm">{settings.maintenance_message}</p>
      ) : null}
      <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-base font-semibold text-primary">
          {settings?.logo ? (
            // 站点 Logo 来自后端公开 URL。
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo} alt="" className="h-8 w-auto max-w-32 object-contain" />
          ) : null}
          <span className="truncate">{siteName}</span>
        </Link>
        <nav className="hidden items-center justify-center gap-6 lg:flex" aria-label="主导航">
          <MainNavLinks pathname={pathname} />
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-3">
          <Link href="/consult?source=header" className="hidden sm:inline">
            <Button variant="accent">立即咨询</Button>
          </Link>
          <AuthEntry />
          <Button
            type="button"
            variant="ghost"
            className="px-2 lg:hidden"
            aria-label="打开菜单"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="left-0 top-0 h-full max-h-none w-80 max-w-[min(20rem,85vw)] translate-x-0 translate-y-0 rounded-none p-6">
          <DialogTitle>导航</DialogTitle>
          <nav className="mt-6 grid gap-4" aria-label="主导航">
            <MainNavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} stacked />
            <Link href="/consult?source=header" className="text-sm text-primary" onClick={() => setMenuOpen(false)}>立即咨询</Link>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function MainNavLinks({
  pathname,
  onNavigate,
  stacked = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  stacked?: boolean;
}) {
  return (
    <>
      {siteConfig.nav.map((item) =>
        "ecosystem" in item ? (
          <EcosystemNavLink
            key={item.label}
            label={item.label}
            className={cn(navLinkClass, stacked && "block")}
            onNavigate={onNavigate}
          />
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(navLinkClass, stacked && "block", isNavActive(pathname, item.href) && navActiveClass)}
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

export function SiteFooter() {
  const { settings, siteName } = useSystemSettings();
  return (
    <footer className="mt-auto bg-[#0b1f44] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm">
        <p className="font-semibold">{siteName}</p>
        <p className="text-white/70">计量检测岗位培训服务，课程内容以后台发布为准。</p>
        <div className="text-white/70">
          {settings?.customer_service_phone ? <p>热线 {settings.customer_service_phone}</p> : null}
          {settings?.icp_number ? <p>{settings.icp_number}</p> : null}
        </div>
      </div>
    </footer>
  );
}
