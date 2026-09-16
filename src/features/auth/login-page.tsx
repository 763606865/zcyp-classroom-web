"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { useAuth } from "./auth-provider";
import { SmsLoginForm } from "./sms-login-form";
import { LoginHeader } from "./login-header";

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
    <div className="relative flex min-h-screen flex-col bg-white">
      {/* 登录页专属头部 */}
      <LoginHeader />

      {/* 背景图 */}
      <div
        className="pointer-events-none absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/login/logo-bg.png)",
          backgroundSize: "cover",
        }}
        aria-hidden
      />

      {/* 主内容区 */}
      <main className="relative z-10 flex w-full flex-1 px-6 lg:px-12">
        {/* 左侧文案 */}
        <div className="hidden flex-1 pt-[92px] lg:block">
          <h1 className="text-[44px] font-bold leading-tight tracking-tight">
            <span className="text-[#0A1B39]">欢迎！</span>
            <span className="text-[#0F62FE]">登录中测培训</span>
          </h1>
          <p className="mt-[17px] max-w-md text-base leading-7 text-[#999999]">
            面向计量与检测从业者的在线培训平台，提供公开课、线下班和混合式培训。
          </p>
        </div>

        {/* 右侧登录卡片 — 距顶部216px、距右侧289px */}
        <div className="absolute right-[10%] top-[216px] w-[420px] lg:block hidden">
          <div className="rounded-xl bg-white shadow-lg">
            <h2 className="pt-[67px] text-center text-[28px] font-semibold text-[#0A1B39]">验证码登录/注册</h2>
            <p className="mt-1 text-center text-sm text-[#999999]">
              {settings?.registration_enabled === false
                ? "当前未开放新用户注册，已有账号仍可登录。"
                : "首次验证通过即自动注册中测易聘账号"}
            </p>
            <div className="px-6 pb-8 pt-[40px]">
              {settings?.sms_enabled === false ? (
                <p className="text-sm text-muted-foreground">短信登录暂未开启，请稍后再试。</p>
              ) : (
                <SmsLoginForm onSuccess={() => router.replace(mountedNext)} />
              )}
            </div>
          </div>
        </div>

        {/* 小屏幕居中登录卡片 */}
        <div className="mx-auto w-full max-w-md lg:hidden mt-[50%] translate-y-[-50%]">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-center text-xl font-semibold text-[#0A1B39]">验证码登录/注册</h2>
            <p className="mt-2 text-center text-sm text-[#999999]">
              {settings?.registration_enabled === false
                ? "当前未开放新用户注册，已有账号仍可登录。"
                : "首次验证通过即自动注册中测易聘账号"}
            </p>
            <div className="mt-6">
              {settings?.sms_enabled === false ? (
                <p className="text-sm text-muted-foreground">短信登录暂未开启，请稍后再试。</p>
              ) : (
                <SmsLoginForm onSuccess={() => router.replace(mountedNext)} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 底部热线 + 备案号 */}
      <footer className="relative z-10 py-6 text-center text-sm text-[#999999]">
        <div className="flex items-center justify-center gap-6">
          {settings?.customer_service_phone ? (
            <span>热线 {settings.customer_service_phone}</span>
          ) : null}
          {settings?.icp_number ? <span>{settings.icp_number}</span> : null}
        </div>
      </footer>
    </div>
  );
}
