"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { applyApiFieldErrors, getApiErrorMessage } from "@/lib/forms";
import { updateProfile } from "./api";

const profileSchema = z.object({
  real_name: z.string().trim().max(255).optional(),
  nick_name: z.string().trim().max(50).optional(),
  email: z.string().trim().email("请输入正确邮箱").or(z.literal("")).optional(),
  gender: z.enum(["0", "1", "2"]),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string>();
  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      real_name: user?.real_name ?? "",
      nick_name: user?.nick_name ?? "",
      email: user?.email ?? "",
      gender: String(user?.gender ?? 0) as ProfileValues["gender"],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await updateProfile({
        real_name: values.real_name || null,
        nick_name: values.nick_name || null,
        email: values.email || null,
        gender: Number(values.gender) as 0 | 1 | 2,
      });
      await refreshUser();
      toast({ title: "资料已更新" });
    } catch (error) {
      if (!applyApiFieldErrors(error, setError)) setFormError(getApiErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-5" noValidate>
      {formError ? <Alert>{formError}</Alert> : null}
      <FormField id="real_name" label="真实姓名" error={errors.real_name?.message}>
        <Input id="real_name" {...register("real_name")} />
      </FormField>
      <FormField id="nick_name" label="昵称" error={errors.nick_name?.message}>
        <Input id="nick_name" {...register("nick_name")} />
      </FormField>
      <FormField id="email" label="邮箱" error={errors.email?.message}>
        <Input id="email" type="email" {...register("email")} />
      </FormField>
      <FormField id="gender" label="性别" error={errors.gender?.message}>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">未知</SelectItem>
                <SelectItem value="1">男</SelectItem>
                <SelectItem value="2">女</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <p className="text-sm text-muted-foreground">手机号：{user?.phone}</p>
      <Button type="submit" loading={isSubmitting}>保存资料</Button>
    </form>
  );
}
