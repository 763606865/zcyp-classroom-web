"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar, avatarImageSrc, displayName } from "@/features/user/user-avatar";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { useAuth } from "./auth-provider";

export function AuthEntry() {
  const { status, user } = useAuth();
  const { settings } = useSystemSettings();
  const pathname = usePathname();
  if (status === "loading") {
    return <span className="inline-block size-8 rounded-full bg-muted" aria-hidden />;
  }
  if (status === "authenticated" && user) {
    const name = displayName(user);
    return (
      <Link href="/account" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
        <UserAvatar name={name} src={avatarImageSrc(user.avatar, settings?.default_avatar)} className="size-8 text-xs" />
        <span className="hidden max-w-24 truncate sm:inline">{name}</span>
      </Link>
    );
  }
  const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
  return <Link href={`/login${next}`}><Button>登录</Button></Link>;
}
