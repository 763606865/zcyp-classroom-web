"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { useAuth } from "./auth-provider";
import { SmsLoginForm } from "./sms-login-form";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const { settings } = useSystemSettings();
  const next = searchParams.get("next") || "/account";
  const [mountedNext] = useState(next);

  useEffect(() => {
    if (status === "authenticated") router.replace(mountedNext);
  }, [mountedNext, router, status]);

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <h1 className="text-2xl font-semibold">短信登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {settings?.registration_enabled === false
            ? "当前未开放新用户注册，已有账号仍可登录。"
            : "未注册的手机号会自动创建账号。"}
        </p>
        <div className="mt-6">
          {settings?.sms_enabled === false ? (
            <p className="text-sm text-muted-foreground">短信登录暂未开启，请稍后再试。</p>
          ) : (
            <SmsLoginForm onSuccess={() => router.replace(mountedNext)} />
          )}
        </div>
      </Card>
    </div>
  );
}
