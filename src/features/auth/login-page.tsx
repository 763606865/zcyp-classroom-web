"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { useAuth } from "./auth-provider";
import { SmsLoginForm } from "./sms-login-form";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const { settings, siteName } = useSystemSettings();
  const next = searchParams.get("next") || "/account";
  const [mountedNext] = useState(next);

  useEffect(() => {
    if (status === "authenticated") router.replace(mountedNext);
  }, [mountedNext, router, status]);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="relative flex min-h-52 flex-col justify-end overflow-hidden bg-[#0b1f44] px-8 py-10 text-white lg:min-h-[calc(100vh-12rem)] lg:w-[42%] lg:px-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(15_98_254/0.35),transparent_42%),radial-gradient(circle_at_80%_80%,rgb(255_165_0/0.18),transparent_40%)]" />
        <div className="relative max-w-md">
          <p className="text-sm text-white/70">计量 · 检测 · 岗位培训</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">欢迎来到{siteName}</h1>
          <p className="mt-4 text-sm leading-7 text-white/80">{siteConfig.description}</p>
        </div>
      </aside>
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold">短信登录</h2>
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
        </div>
      </section>
    </div>
  );
}
