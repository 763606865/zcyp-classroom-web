"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
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
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, control, reset, setError, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
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

  const btnBase = "inline-flex items-center justify-center rounded text-sm font-medium transition-colors";
  const btnEdit = "h-8 px-[13px] py-[6px] bg-[#0F62FE] text-white hover:bg-[#0D56D6]";
  const btnDanger = "h-8 px-[13px] py-[6px] bg-[#F16767] text-white hover:bg-[#E05555]";

  return (
    <div className="grid gap-[17px]">
      {/* 个人信息卡片 */}
      <div className="rounded-md border border-black/10 bg-white" style={{ padding: "32px" }}>
      {/* Header */}
      <div className="relative mb-6">
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: "#222" }}>个人信息</h1>
          <p className="mt-[6px] text-sm" style={{ color: "rgba(34,34,34,0.6)" }}>头像会显示在课堂评论与个人中心。</p>
        </div>
        <div className="absolute z-10" style={{ right: 0, top: 0 }}>
          {editing ? (
            <div className="flex gap-2">
              <button type="submit" form="profile-form" className={`${btnBase} ${btnEdit}`} disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </button>
              <button type="button" className={`${btnBase} border border-black/15 bg-white px-[13px] py-[6px] text-[#555] hover:bg-gray-50`} onClick={() => { setEditing(false); reset(); setFormError(undefined); }}>
                取消
              </button>
            </div>
          ) : (
            <button type="button" className={`${btnBase} ${btnEdit}`} onClick={() => setEditing(true)}>
              编辑个人信息
            </button>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="mb-8 flex items-center gap-4">
        <UserAvatar name={name} src={avatarSrc} className="h-20 w-20 text-xl" />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => void handleAvatar(event.target.files)}
          />
          <button type="button" className={`${btnBase} border border-[#0F62FE] bg-transparent px-[13px] py-[6px] text-[#0F62FE] hover:bg-blue-50`} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? "上传中..." : "更换头像"}
          </button>
          <p className="mt-2 text-xs" style={{ color: "#999" }}>支持jpg/png格式，图片大小不超过2M</p>
        </div>
      </div>

      {/* Form */}
      <form id="profile-form" onSubmit={onSubmit} className="grid gap-5" noValidate>
        {formError ? <Alert>{formError}</Alert> : null}

        {/* 真实姓名 */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "80px minmax(0, 70%)" }}>
          <Label htmlFor="real_name" className="text-right text-sm" style={{ color: "#222" }}>真实姓名</Label>
          <Input id="real_name" className="h-10 text-sm" disabled={!editing} {...register("real_name")} />
        </div>
        {errors.real_name?.message && <p className="ml-[92px] text-xs text-red-500">{errors.real_name.message}</p>}

        {/* 用户昵称 */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "80px minmax(0, 70%)" }}>
          <Label htmlFor="nick_name" className="text-right text-sm" style={{ color: "#222" }}>用户昵称</Label>
          <Input id="nick_name" className="h-10 text-sm" disabled={!editing} {...register("nick_name")} />
        </div>
        {errors.nick_name?.message && <p className="ml-[92px] text-xs text-red-500">{errors.nick_name.message}</p>}

        {/* 邮箱 */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "80px minmax(0, 70%)" }}>
          <Label htmlFor="email" className="text-right text-sm" style={{ color: "#222" }}>邮箱</Label>
          <Input id="email" type="email" className="h-10 text-sm" disabled={!editing} {...register("email")} />
        </div>
        {errors.email?.message && <p className="ml-[92px] text-xs text-red-500">{errors.email.message}</p>}

        {/* 性别 */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "80px minmax(0, 70%)" }}>
          <Label htmlFor="gender" className="text-right text-sm" style={{ color: "#222" }}>性别</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!editing}>
                <SelectTrigger id="gender" className="h-10">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未知</SelectItem>
                  <SelectItem value="1">男</SelectItem>
                  <SelectItem value="2">女</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {errors.gender?.message && <p className="ml-[92px] text-xs text-red-500">{errors.gender.message}</p>}

        {/* 手机号（始终只读） */}
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "80px minmax(0, 70%)" }}>
          <span className="text-right text-sm" style={{ color: "#222" }}>手机号</span>
          <Input className="h-10 text-sm" value={user?.phone ? maskPhone(user.phone) : "—"} disabled readOnly />
        </div>
      </form>

      </div>

      {/* 退出登录卡片 */}
      <div className="flex items-center justify-between rounded-md border border-black/10 bg-white" style={{ padding: "16px 20px" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#222" }}>退出登录</p>
          <p className="mt-1 text-xs" style={{ color: "#999" }}>退出后需重新用手机号验证码登录。</p>
        </div>
        <button type="button" className={`${btnBase} ${btnDanger}`} onClick={logout}>退出登录</button>
      </div>
    </div>
  );
}
