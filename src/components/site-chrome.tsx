"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageSquare } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthEntry } from "@/features/auth/auth-entry";
import { EcosystemNavLink } from "@/features/auth/ecosystem-nav-link";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

const navLinkClass = "relative text-base font-normal text-[#595959] transition hover:text-[#222222]";
// 高亮菜单：文字下方 6px 处一条 2px 高、#0F62FE 的等宽横线。
const navActiveClass =
  "font-medium text-[#222222] after:absolute after:left-0 after:top-[calc(100%+6px)] after:h-[2px] after:w-full after:bg-[#0F62FE] after:content-['']";

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { settings } = useSystemSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-50 bg-[#f5f9fd]">
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
          {/* <span className="truncate">{siteName}</span> */}
        </Link>
        <nav className="hidden items-center justify-center gap-6 lg:flex" aria-label="主导航">
          <MainNavLinks pathname={pathname} />
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-3">
          <Link href="/consult?source=header" className="hidden sm:inline">
            <button
              type="button"
              className="inline-flex items-center gap-[2px] rounded bg-[#0F62FE] font-medium text-white transition hover:bg-[#0F62FE]/90"
              style={{ height: 32, padding: "8px 16px", fontSize: 14, borderRadius: 4 }}
            >
              <MessageSquare style={{ width: 16, height: 16 }} />
              <span>立即咨询</span>
            </button>
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
            icon={<Image src="/images/home/yp-logo.png" width={16} height={16} alt="" />}
            className={cn("text-[14px] font-normal text-[#000000] flex items-center", stacked && "block")}
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
  const pathname = usePathname();
  const { settings, siteName } = useSystemSettings();
  if (pathname === "/login") return null;
  // 热线与备案号优先取后端配置，为空时回退设计稿文案。
  const phone = settings?.customer_service_phone || "0791-86375557";
  const icp = settings?.icp_number || "赣ICP备18006578号-1";

  return (
    <footer className="mt-auto bg-[#0B1E49] text-white">
      <div className="px-6 pb-[35px] pt-[55px] lg:px-[120px]">
        <div className="flex flex-wrap items-start justify-between gap-x-16 gap-y-10">
          <div className="max-w-[420px]">
            <Image src="/images/home/footer-logo.png" width={122} height={32} alt={siteName} />
            <p className="mt-6 text-sm leading-6 text-[#A8B6D3]">
              计量检测岗位培训 · 公开课、线下班与混合式培训一体，
              <br />
              从报名、学习到考试形成完整闭环。
            </p>
            <p className="mt-6 text-sm text-[#A8B6D3]">咨询热线： {phone}</p>
          </div>
          <nav className="flex flex-wrap gap-x-12 gap-y-6 pt-1" aria-label="页脚导航">
            {siteConfig.footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-white transition hover:text-white/80"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-between gap-2 border-t border-white/12 pt-6 text-[13px] text-[#7C8DB5]">
          <p>{new Date().getFullYear()} {siteName} · 计量检测岗位培训 版权所有</p>
          <p>{icp}</p>
        </div>
      </div>
    </footer>
  );
}
