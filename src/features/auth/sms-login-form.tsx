"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCountdown } from "@/hooks";
import { applyApiFieldErrors, getApiErrorMessage } from "@/lib/forms";
import { sendLoginSmsCode } from "./api";
import { smsLoginSchema, type SmsLoginValues } from "./schemas";
import { useAuth } from "./auth-provider";

export function SmsLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const countdown = useCountdown();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, getValues, setError, formState: { errors, isSubmitting } } = useForm<SmsLoginValues>({
    resolver: zodResolver(smsLoginSchema), defaultValues: { phone: "", code: "" },
  });

  async function sendCode() {
    const parsed = smsLoginSchema.shape.phone.safeParse(getValues("phone"));
    if (!parsed.success) { setError("phone", { message: parsed.error.issues[0]?.message }); return; }
    try {
      const result = await sendLoginSmsCode(parsed.data);
      countdown.start(60);
      toast({ title: result.data.message, description: `验证码 ${result.data.expires_in / 60} 分钟内有效` });
    } catch (error) {
      if (!applyApiFieldErrors(error, setError)) setFormError(getApiErrorMessage(error));
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await login(values.phone, values.code);
      toast({ title: "登录成功" });
      onSuccess?.();
    } catch (error) {
      if (!applyApiFieldErrors(error, setError)) setFormError(getApiErrorMessage(error, "登录失败，请重试"));
    }
  });

  return <form onSubmit={onSubmit} className="grid gap-5" noValidate>
    {formError ? <Alert>{formError}</Alert> : null}
    <FormField id="phone" label="手机号" error={errors.phone?.message}>
      <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="请输入手机号" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} {...register("phone")} />
    </FormField>
    <FormField id="code" label="验证码" error={errors.code?.message}>
      <div className="flex gap-2">
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 位验证码" aria-invalid={Boolean(errors.code)} aria-describedby={errors.code ? "code-error" : undefined} {...register("code")} />
        <Button type="button" variant="secondary" disabled={countdown.isRunning} onClick={() => void sendCode()} className="shrink-0">{countdown.isRunning ? `${countdown.remaining}s` : "获取验证码"}</Button>
      </div>
    </FormField>
    <Button type="submit" loading={isSubmitting} className="w-full">登录</Button>
  </form>;
}
