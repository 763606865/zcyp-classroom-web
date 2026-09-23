"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyClass, MyCourse, MyTraining } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDateTime, statusLabel } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { ProfileForm } from "@/features/user/profile-form";
import { UserAvatar, avatarImageSrc, displayName, maskPhone } from "@/features/user/user-avatar";
import { useSystemSettings } from "@/features/system-settings/system-settings-provider";
import { getMyClasses, getMyCourses, getMyTrainings } from "./api";
import { AccountOverviewPanel } from "./account-overview";
import { MyExamsPanel } from "./my-exams";
import { MyFavoritesPanel } from "./my-favorites";
import { MyHomeworksPanel } from "./my-homeworks";

type Tab = "overview" | "trainings" | "courses" | "favorites" | "classes" | "homeworks" | "exams" | "profile";

const navGroups: { title: string; items: { id: Tab; label: string; iconNormal: string; iconActive: string }[] }[] = [
  {
    title: "学习",
    items: [
      { id: "overview", label: "学习概览", iconNormal: "/images/personal/preview.png", iconActive: "/images/personal/preview-act.png" },
      { id: "trainings", label: "我的培训", iconNormal: "/images/personal/train.png", iconActive: "/images/personal/train-act.png" },
      { id: "courses", label: "我的课程", iconNormal: "/images/personal/course.png", iconActive: "/images/personal/course-act.png" },
      { id: "classes", label: "我的班级", iconNormal: "/images/personal/classroom.png", iconActive: "/images/personal/classroom-act.png" },
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

export function AccountPageView() {
  const router = useRouter();
  const { status, user } = useAuth();
  const { settings } = useSystemSettings();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/account");
  }, [router, status]);

  if (status === "loading" || status === "anonymous" || !user) {
    return <div className="flex justify-center py-20"><Spinner label="加载个人中心" /></div>;
  }

  const name = displayName(user);

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
            {navGroups.map((group) => (
              <div key={group.title} className="mb-[14px] grid gap-0 last:mb-0">
                <p className="text-xs font-medium pb-[4px]" style={{ color: "#555", paddingLeft: "1px" }}>{group.title}</p>
                {group.items.map((item) => {
                  const isActive = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
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
      <section className="min-w-0 flex-1 overflow-hidden rounded-md border border-black/10 bg-white">
        {/* 移动端顶部导航 */}
        <div className="flex overflow-x-auto border-b lg:hidden" style={{ borderColor: "#ECECEC" }}>
          {navGroups.flatMap((g) => g.items).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                tab === item.id ? "border-b-2 text-[#0F62FE]" : "text-[#555]"
              }`}
              style={tab === item.id ? { borderBottomColor: "#0F62FE" } : {}}
            >
              {item.label}
            </button>
          ))}
        </div>
        {/* 内容 */}
        <div className="px-[32px] py-[17px] pb-[22px] sm:px-[28px]">
          {tab === "overview" ? <AccountOverviewPanel /> : null}
          {tab === "profile" ? <ProfileForm /> : null}
          {tab === "trainings" ? <Panel title="我的培训" description="已报名的培训项目。"><MyTrainingsPanel /></Panel> : null}
          {tab === "courses" ? <Panel title="我的课程" description="继续上课或查看学习进度。"><MyCoursesPanel /></Panel> : null}
          {tab === "favorites" ? <Panel title="我的收藏" description="收藏的课程与培训。"><MyFavoritesPanel /></Panel> : null}
          {tab === "classes" ? <Panel title="我的班级" description="已加入的培训班级。"><MyClassesPanel /></Panel> : null}
          {tab === "homeworks" ? <Panel title="我的作业" description="按作业作答、查看批改结果。"><MyHomeworksPanel /></Panel> : null}
          {tab === "exams" ? <Panel title="我的考试" description="进入考场或查看成绩。"><MyExamsPanel /></Panel> : null}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-[20px] font-semibold" style={{ color: "#222" }}>{title}</h1>
      <p className="mt-[6px] text-sm" style={{ color: "rgba(34, 34, 34, 0.6)" }}>{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function MyTrainingsPanel() {
  const [items, setItems] = useState<MyTraining[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getMyTrainings()
      .then((result) => { if (!cancelled) setItems(result.data.data); })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <EmptyState title="无法加载我的培训" description={error} />;
  if (items.length === 0) return <EmptyState title="还没有报名培训" description="去培训列表看看近期开班项目。" action={<Link href="/trainings" className="text-sm text-primary">浏览培训</Link>} />;

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/account/trainings/${item.training.slug}`} className="font-semibold hover:text-primary">{item.training.title}</Link>
            <p className="mt-1 text-sm text-muted-foreground">报名时间 {formatDateTime(item.enrolled_at)}</p>
          </div>
          <span className="text-sm">{statusLabel(item.status)}</span>
        </Card>
      ))}
    </div>
  );
}

function MyCoursesPanel() {
  const [items, setItems] = useState<MyCourse[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getMyCourses()
      .then((result) => { if (!cancelled) setItems(result.data.data); })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <EmptyState title="无法加载我的课程" description={error} />;
  if (items.length === 0) return <EmptyState title="还没有课程" />;

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/account/courses/${item.course.id}`} className="font-semibold hover:text-primary">{item.course.title}</Link>
            <p className="mt-1 text-sm text-muted-foreground">进度 {item.progress ?? 0}%</p>
          </div>
          <Link href={`/account/courses/${item.course.id}`} className="text-sm text-primary">去上课</Link>
        </Card>
      ))}
    </div>
  );
}

function MyClassesPanel() {
  const [items, setItems] = useState<MyClass[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getMyClasses()
      .then((result) => { if (!cancelled) setItems(result.data.data); })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <EmptyState title="无法加载班级" description={error} />;
  if (items.length === 0) return <EmptyState title="还没有班级" />;

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <p className="font-semibold">{item.name}{item.code ? `（${item.code}）` : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.training?.title ?? "未关联培训"} · {statusLabel(item.member_status ?? item.status)}
          </p>
        </Card>
      ))}
    </div>
  );
}
