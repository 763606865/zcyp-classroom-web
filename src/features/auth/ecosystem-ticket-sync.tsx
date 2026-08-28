"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/forms";
import { useAuth } from "./auth-provider";

const TICKET_QUERY = "zc_center_auth_ticket";

export function EcosystemTicketSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ticket = searchParams.get(TICKET_QUERY)?.trim() ?? "";
  const { status, loginWithEcosystemTicket } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [handledTicket, setHandledTicket] = useState<string>();

  useEffect(() => {
    if (status === "loading" || !ticket || handledTicket === ticket) return;
    setOpen(true);
  }, [handledTicket, status, ticket]);

  function urlWithoutTicket() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(TICKET_QUERY);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function decline() {
    if (submitting) return;
    if (ticket) setHandledTicket(ticket);
    setOpen(false);
    router.replace(urlWithoutTicket(), { scroll: false });
  }

  async function confirm() {
    if (!ticket || submitting) return;
    setSubmitting(true);
    try {
      await loginWithEcosystemTicket(ticket);
      setHandledTicket(ticket);
      setOpen(false);
      window.location.assign(urlWithoutTicket());
    } catch (error) {
      setSubmitting(false);
      toast({ title: "同步失败", description: getApiErrorMessage(error, "票据无效或已过期，请从中台重新进入") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) decline(); }}>
      <DialogContent onPointerDownOutside={(event) => { if (submitting) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (submitting) event.preventDefault(); }}>
        <DialogTitle>同步中台账号</DialogTitle>
        <DialogDescription>
          检测到中台登录凭证，是否将中台用户同步到本站并登录？取消后本次凭证将失效，可继续以当前身份浏览。
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" disabled={submitting} onClick={decline}>暂不同步</Button>
          <Button loading={submitting} onClick={() => void confirm()}>确认同步</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
