"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserAvatar, avatarImageSrc, displayName } from "@/features/user/user-avatar";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { useAuth } from "./auth-provider";

export function AuthEntry() {
  const { status, user } = useAuth();
  const { settings } = useSystemSettings();
  const pathname = usePathname();
  const router = useRouter();
  if (status === "loading") {
    return <span className="inline-block size-8 rounded-full bg-muted" aria-hidden />;
  }
  if (status === "authenticated" && user) {
    const name = displayName(user);
    return (
      <button
        type="button"
        onClick={() => router.push("/account")}
        className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
      >
        <UserAvatar name={name} src={avatarImageSrc(user.avatar, settings?.default_avatar)} className="size-8 text-xs" />
        <span className="hidden max-w-24 truncate sm:inline">{name}</span>
      </button>
    );
  }
  const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
  return (
    <Link href={`/login${next}`}>
      <button
        type="button"
        className="inline-flex items-center rounded border border-[#0F62FE] bg-white font-medium text-[#0F62FE] transition hover:bg-[#0F62FE]/10"
        style={{ height: 32, padding: "8px 16px", fontSize: 14, borderRadius: 4 }}
      >
        登录/注册
      </button>
    </Link>
  );
}
