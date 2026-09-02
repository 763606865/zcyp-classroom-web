"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { uploadFile } from "@/features/files/api";
import { applyApiFieldErrors, getApiErrorMessage } from "@/lib/forms";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { updateProfile } from "./api";
import { UserAvatar, avatarImageSrc, displayName, maskPhone } from "./user-avatar";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const profileSchema = z.object({
  real_name: z.string().trim().max(255).optional(),
  nick_name: z.string().trim().max(50).optional(),
  email: z.string().trim().email("请输入正确邮箱").or(z.literal("")).optional(),
  gender: z.enum(["0", "1", "2"]),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, refreshUser, logout } = useAuth();
  const { settings } = useSystemSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      real_name: user?.real_name ?? "",
      nick_name: user?.nick_name ?? "",
      email: user?.email ?? "",
      gender: String(user?.gender ?? 0) as ProfileValues["gender"],
    },
  });

  const name = user ? displayName(user) : "学员";
  const avatarSrc = preview || avatarImageSrc(user?.avatar, settings?.default_avatar);

  async function handleAvatar(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast({ title: "请选择图片文件", description: "支持 jpg、png、webp、gif" });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast({ title: "图片过大", description: "头像不超过 2MB" });
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, "avatar");
      await updateProfile({ avatar: uploaded.data.file.url });
      await refreshUser();
      toast({ title: "头像已更新" });
    } catch (error) {
      setPreview(null);
      toast({ title: "头像更新失败", description: getApiErrorMessage(error) });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
    <div className="grid max-w-2xl gap-8">
      <div>
        <h1 className="text-2xl font-semibold">个人资料</h1>
        <p className="mt-1 text-sm text-muted-foreground">头像会显示在课堂评论与个人中心。</p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          {formError ? <Alert>{formError}</Alert> : null}
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar name={name} src={avatarSrc} className="size-20 text-xl" />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => void handleAvatar(event.target.files)}
              />
              <Button type="button" loading={uploading} onClick={() => fileInputRef.current?.click()}>更换头像</Button>
              <p className="mt-2 text-xs text-muted-foreground">支持 jpg / png，不超过 2MB</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>
          <p className="text-sm text-muted-foreground">手机号：{user?.phone ? maskPhone(user.phone) : "—"}</p>
          <div>
            <Button type="submit" loading={isSubmitting}>保存资料</Button>
          </div>
        </form>
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">退出登录</p>
          <p className="mt-1 text-sm text-muted-foreground">退出后需重新用手机号验证码登录。</p>
        </div>
        <Button type="button" variant="danger" onClick={logout}>退出登录</Button>
      </Card>
    </div>
  );
}
