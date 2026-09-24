"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/auth-provider";
import { UserAvatar, avatarImageSrc, displayName, maskPhone } from "@/features/user/user-avatar";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";

export type AccountTab = "overview" | "trainings" | "courses" | "favorites" | "classes" | "homeworks" | "exams" | "profile";

export const accountNavGroups: { title: string; items: { id: AccountTab; label: string; iconNormal: string; iconActive: string }[] }[] = [
  {
    title: "学习",
    items: [
      { id: "overview", label: "学习概览", iconNormal: "/images/personal/preview.png", iconActive: "/images/personal/preview-act.png" },
      { id: "trainings", label: "我的培训", iconNormal: "/images/personal/train.png", iconActive: "/images/personal/train-act.png" },
      { id: "courses", label: "我的课程", iconNormal: "/images/personal/course.png", iconActive: "/images/personal/course-act.png" },
      { id: "favorites", label: "我的收藏", iconNormal: "/images/personal/collection.png", iconActive: "/images/personal/collection-act.png" },
    ],
  },
  {
    title: "任务",
    items: [
      { id: "homeworks", label: "我的作业", iconNormal: "/images/personal/homework.png", iconActive: "/images/personal/homework-act.png" },
      { id: "exams", label: "我的考试", iconNormal: "/images/personal/exam.png", iconActive: "/images/personal/exam-act.png" },
    ],
  },
  {
    title: "用户",
    items: [{ id: "profile", label: "个人信息", iconNormal: "/images/personal/userinfo.png", iconActive: "/images/personal/userinfo-act.png" }],
  },
];

export function AccountShell({
  active,
  children,
  onNavigate,
  contentClassName = "bg-white",
}: {
  active: AccountTab;
  children: ReactNode;
  onNavigate?: (tab: AccountTab) => void;
  contentClassName?: string;
}) {
  const router = useRouter();
  const { status, user } = useAuth();
  const { settings } = useSystemSettings();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/account");
  }, [router, status]);

  if (status === "loading" || status === "anonymous" || !user) {
    return <div className="flex justify-center py-20"><Spinner label="加载个人中心" /></div>;
  }

  const name = displayName(user);

  function handleSelect(tab: AccountTab) {
    if (onNavigate) onNavigate(tab);
    else router.push(`/account?tab=${tab}`);
  }

  return (
    <div className="flex gap-4">
      {/* 左侧菜单（桌面端） */}
      <aside className="sticky top-24 hidden h-fit w-[236px] shrink-0 self-start lg:block">
        <Card className="overflow-hidden rounded-md border border-black/10 bg-white" style={{ padding: "26px 12px 32px" }}>
          {/* 用户信息 */}
          <div className="flex items-center gap-3 pb-6" style={{ borderBottom: "1px solid #ECECEC", paddingLeft: "10px", paddingRight: "10px", paddingTop: "0" }}>
            <UserAvatar name={name} src={avatarImageSrc(user.avatar, settings?.default_avatar)} className="h-16 w-16 text-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-semibold" style={{ color: "#222" }} title={name}>{name}</p>
              <p className="mt-[11px] truncate text-sm" style={{ color: "#555" }} title={maskPhone(user.phone)}>{maskPhone(user.phone)}</p>
            </div>
          </div>
          {/* 菜单区域 */}
          <nav className="grid gap-0" style={{ paddingTop: "13px", paddingLeft: "4px" }} aria-label="个人中心">
            {accountNavGroups.map((group) => (
              <div key={group.title} className="mb-[14px] grid gap-0 last:mb-0">
                <p className="text-xs font-medium pb-[4px]" style={{ color: "#555", paddingLeft: "1px" }}>{group.title}</p>
                {group.items.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`flex h-10 items-center gap-[2px] rounded-md text-left text-sm transition-all ${
                        isActive ? "text-white" : "hover:bg-gray-50"
                      }`}
                      style={
                        isActive
                          ? { background: "linear-gradient( 90deg, #0F62FE 0%, #5582FF 100%)", color: "#fff", paddingLeft: "28px", paddingRight: "12px" }
                          : { color: "#222", paddingLeft: "28px", paddingRight: "12px" }
                      }
                    >
                      <img
                        src={isActive ? item.iconActive : item.iconNormal}
                        alt=""
                        className="h-4 w-4 shrink-0"
                        width={16}
                        height={16}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </Card>
      </aside>

      {/* 右侧内容区（含移动端顶部导航） */}
      <section className={`relative min-w-0 flex-1 rounded-md border border-black/10 ${contentClassName}`}>
        {/* 移动端顶部导航 */}
        <div className="flex overflow-x-auto border-b lg:hidden" style={{ borderColor: "#ECECEC" }}>
          {accountNavGroups.flatMap((g) => g.items).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                active === item.id ? "border-b-2 text-[#0F62FE]" : "text-[#555]"
              }`}
              style={active === item.id ? { borderBottomColor: "#0F62FE" } : {}}
            >
              {item.label}
            </button>
          ))}
        </div>
        {/* 内容 */}
        {children}
      </section>
    </div>
  );
}
