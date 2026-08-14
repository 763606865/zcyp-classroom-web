"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "./auth-provider";
import { SmsLoginForm } from "./sms-login-form";

export function AuthEntry() {
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (status === "loading") return <Button variant="secondary" disabled>加载会话…</Button>;
  if (status === "authenticated") return <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{user?.nick_name ?? user?.phone}</span><Button variant="secondary" onClick={logout}>退出</Button></div>;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button>短信登录</Button></DialogTrigger>
    <DialogContent>
      <DialogTitle>登录 Caiyun</DialogTitle>
      <DialogDescription>未注册的手机号会自动创建账号。</DialogDescription>
      <div className="mt-6"><SmsLoginForm onSuccess={() => setOpen(false)} /></div>
    </DialogContent>
  </Dialog>;
}
