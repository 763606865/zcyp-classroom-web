"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

export function HomeLeadBar() {
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast({ title: "咨询已提交", description: "教务老师将尽快与你联系。" });
      form.reset();
    }, 400);
  }

  return (
    <>
      <div id="lead" className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-hover bg-primary px-4 py-3 text-primary-foreground">
        <form onSubmit={onSubmit} className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center">
          <p className="shrink-0 text-sm font-medium">免费试听 / 课程咨询</p>
          <Input name="name" required placeholder="姓名" className="h-10 min-h-10 border-white/30 bg-white text-foreground" />
          <Input name="phone" required type="tel" placeholder="手机号" className="h-10 min-h-10 border-white/30 bg-white text-foreground" />
          <Input name="city" placeholder="城市" className="h-10 min-h-10 border-white/30 bg-white text-foreground" />
          <Input name="course" placeholder="意向课程" className="h-10 min-h-10 border-white/30 bg-white text-foreground" />
          <Button type="submit" variant="accent" loading={submitting} className="shrink-0">免费试听</Button>
        </form>
      </div>
      <aside className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg sm:flex">
        <a href="#lead" className="px-3 py-3 text-center text-xs text-primary hover:bg-muted">咨询</a>
        {settings?.customer_service_phone ? (
          <a href={`tel:${settings.customer_service_phone}`} className="border-t border-border px-3 py-3 text-center text-xs hover:bg-muted">电话</a>
        ) : null}
        <a href="#top" className="border-t border-border px-3 py-3 text-center text-xs hover:bg-muted">顶部</a>
      </aside>
    </>
  );
}
