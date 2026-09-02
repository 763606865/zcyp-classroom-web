"use client";

import { cn } from "@/lib/utils/cn";

export function displayName(user: { nick_name?: string | null; real_name?: string | null; phone?: string }) {
  return user.nick_name || user.real_name || "学员";
}

export function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function avatarImageSrc(avatar?: string | null, fallback?: string | null) {
  const value = avatar || fallback;
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  return null;
}

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // 头像来自后端存储域名
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary",
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 1)}
    </div>
  );
}
