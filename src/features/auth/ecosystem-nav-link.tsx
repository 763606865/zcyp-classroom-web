"use client";

import { useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { publicEnv } from "@/config/env";
import { getApiErrorMessage } from "@/lib/forms";
import { useToast } from "@/components/ui/toast";
import { getEcosystemTicket } from "./api";
import { useAuth } from "./auth-provider";

const TICKET_QUERY = "zc_center_auth_ticket";

// 中测易聘门户导航：登录后签发中台生态票据并附在跳转地址上完成登录同步；未登录先引导登录。
export function EcosystemNavLink({
  label,
  className,
  onNavigate,
}: {
  label: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const { toast } = useToast();
  const [issuing, setIssuing] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (issuing) return;

    if (status !== "authenticated") {
      toast({ title: "请先登录", description: `请先登录后进入${label}` });
      const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      onNavigate?.();
      router.push(`/login${next}`);
      return;
    }

    setIssuing(true);
    try {
      const { data } = await getEcosystemTicket(publicEnv.NEXT_PUBLIC_ZCYP_APP_CODE);
      if (!data.ticket) throw new Error("未获取到中台登录凭证");
      const url = new URL(publicEnv.NEXT_PUBLIC_ZCYP_PORTAL_URL);
      url.searchParams.set(TICKET_QUERY, data.ticket);
      onNavigate?.();
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({ title: `暂时无法进入${label}`, description: getApiErrorMessage(error, "中台登录凭证签发失败，请稍后重试") });
    } finally {
      setIssuing(false);
    }
  }

  return (
    <a
      href={publicEnv.NEXT_PUBLIC_ZCYP_PORTAL_URL}
      rel="noopener noreferrer"
      className={className}
      onClick={(event) => void handleClick(event)}
    >
      {label}
    </a>
  );
}
