"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { AuthEntry } from "@/features/auth/auth-entry";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="text-base font-semibold">{siteConfig.name}</Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex" aria-label="主导航">
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
        <AuthEntry />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
        <p>{siteConfig.name}</p>
        <p>在线培训样板</p>
      </div>
    </footer>
  );
}
