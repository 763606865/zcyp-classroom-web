"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { ConsultForm } from "./consult-form";

export function ConsultPageView() {
  const { siteName, settings } = useSystemSettings();

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <div>
        <p className="text-sm font-medium text-primary">免费试听 / 课程咨询</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">填写咨询信息</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          提交后，{siteName}教务老师会尽快与你联系
          {settings?.customer_service_phone ? `，也可拨打 ${settings.customer_service_phone}` : ""}。
        </p>
      </div>
      <Card>
        <ConsultForm />
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary">返回首页</Link>
      </p>
    </div>
  );
}
