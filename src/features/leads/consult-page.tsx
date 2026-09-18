"use client";

import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { ConsultForm } from "./consult-form";

export function ConsultPageView() {
  const { siteName, settings } = useSystemSettings();

  return (
    <section
      className="w-full"
      style={{
        height: 614,
        backgroundImage: "url(/images/classplan/banner-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#F0F5FF",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-16 px-6">
        {/* 左侧文字区 */}
        <div className="flex-1">
          <p className="flex items-center gap-2 text-xs font-medium" style={{ color: "#0F62FE" }}>
            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#0F62FE" }} />
            免费试听/课程咨询
          </p>
          <h1 className="mt-4 text-5xl font-bold" style={{ color: "#222222" }}>
            填写咨询信息
          </h1>
          <p className="mt-4 text-xl leading-relaxed" style={{ color: "rgba(34,34,34,0.6)" }}>
            提交后，{siteName}教务老师会尽快与你联系
            {settings?.customer_service_phone ? `，也可拨打 ${settings.customer_service_phone}` : ""}。
          </p>
        </div>
        {/* 右侧表单卡片 */}
        <ConsultForm />
      </div>
    </section>
  );
}
