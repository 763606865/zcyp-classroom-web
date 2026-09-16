"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [agreed, setAgreed] = useState(false);
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
      if (!applyApiFieldErrors(error, setError)) toast({ title: getApiErrorMessage(error) });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!agreed) {
      toast({ title: "请先同意用户协议和隐私政策" });
      return;
    }
    try {
      await login(values.phone, values.code);
      toast({ title: "登录成功" });
      onSuccess?.();
    } catch (error) {
      if (!applyApiFieldErrors(error, setError)) toast({ title: getApiErrorMessage(error, "登录失败，请重试") });
    }
  });

  return (
		<form onSubmit={onSubmit} noValidate>
			{/* 手机号 */}
			<div className="relative">
				<div className="flex items-center gap-2 rounded-lg bg-[#F4F5F9] px-4 py-3">
					<img src="/images/login/phone.png" alt="" className="size-6 shrink-0" />
					<input
						type="tel"
						inputMode="numeric"
						autoComplete="tel"
						placeholder="请输入手机号"
						className="w-full bg-transparent text-sm text-foreground placeholder:text-[#BFBFBF] outline-none"
						aria-invalid={Boolean(errors.phone)}
						aria-describedby={errors.phone ? 'phone-error' : undefined}
						{...register('phone')}
					/>
				</div>
				{errors.phone ? (
					<p
						id="phone-error"
						className="absolute top-full left-0 pt-2 text-xs text-danger"
					>
						{errors.phone.message}
					</p>
				) : null}
			</div>

			{/* 验证码 */}
			<div className="relative mt-[33px]">
				<div className="flex items-center gap-2">
					<div className="flex flex-1 items-center gap-2 rounded-lg bg-[#F4F5F9] px-4 py-3">
						<img src="/images/login/code.png" alt="" className="size-6 shrink-0" />
						<input
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							maxLength={6}
							placeholder="请输入验证码"
							className="w-full bg-transparent text-sm text-foreground placeholder:text-[#BFBFBF] outline-none"
							aria-invalid={Boolean(errors.code)}
							aria-describedby={errors.code ? 'code-error' : undefined}
							{...register('code')}
						/>
					</div>
					<button
						type="button"
						disabled={countdown.isRunning}
						onClick={() => void sendCode()}
						className="shrink-0 px-4 font-medium text-[#0F62FE] transition disabled:cursor-not-allowed disabled:opacity-50"
						style={{
							height: 44,
							fontSize: 16,
							borderRadius: 6,
							backgroundColor: 'rgba(15, 98, 254, 0.10)',
						}}
					>
						{countdown.isRunning ? `${countdown.remaining}s` : '获取验证码'}
					</button>
				</div>
				{errors.code ? (
					<p
						id="code-error"
						className="absolute top-full left-0 pt-2 text-xs text-danger"
					>
						{errors.code.message}
					</p>
				) : null}
			</div>

			{/* 登录按钮 */}
			<Button
				type="submit"
				loading={isSubmitting}
				className="mt-[50px] h-11 w-full rounded-lg bg-[#0F62FE] text-base font-medium hover:bg-[#0F62FE]/90"
			>
				登 录
			</Button>

			{/* 协议 */}
			<div className="mt-6 flex items-center gap-2">
				<Checkbox
					id="agreement"
					checked={agreed}
					onCheckedChange={v => setAgreed(v === true)}
				/>
				<label htmlFor="agreement" className="text-xs text-[#999999]">
					我已阅读并同意{' '}
					<a href="#" className="text-[#0F62FE] hover:underline">
						《用户协议》
					</a>{' '}
					和{' '}
					<a href="#" className="text-[#0F62FE] hover:underline">
						《隐私政策》
					</a>
				</label>
			</div>
		</form>
  );
}
