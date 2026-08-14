"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";

export function AuthEntry() {
  const { status, user } = useAuth();
  const pathname = usePathname();
  if (status === "loading") return <Button variant="secondary" disabled>加载会话…</Button>;
  if (status === "authenticated") {
    return (
      <Link href="/account" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        {user?.nick_name ?? user?.phone}
      </Link>
    );
  }
  const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
  return <Link href={`/login${next}`}><Button>登录</Button></Link>;
}
