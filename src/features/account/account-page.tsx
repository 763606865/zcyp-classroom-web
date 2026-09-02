"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Bookmark, ClipboardList, FileText, GraduationCap, LayoutDashboard, UserRound, Users } from "lucide-react";
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

const navGroups: { title: string; items: { id: Tab; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    title: "学习",
    items: [
      { id: "overview", label: "概览", icon: LayoutDashboard },
      { id: "trainings", label: "我的培训", icon: GraduationCap },
      { id: "courses", label: "我的课程", icon: BookOpen },
      { id: "classes", label: "我的班级", icon: Users },
      { id: "favorites", label: "我的收藏", icon: Bookmark },
    ],
  },
  {
    title: "任务",
    items: [
      { id: "homeworks", label: "我的作业", icon: ClipboardList },
      { id: "exams", label: "我的考试", icon: FileText },
    ],
  },
  {
    title: "账户",
    items: [{ id: "profile", label: "个人资料", icon: UserRound }],
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
    <div className="grid items-start gap-6 lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <UserAvatar name={name} src={avatarImageSrc(user.avatar, settings?.default_avatar)} className="size-14 text-lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{maskPhone(user.phone)}</p>
            </div>
          </div>
          <nav className="grid gap-4 p-3" aria-label="个人中心">
            {navGroups.map((group) => (
              <div key={group.title} className="grid gap-1">
                <p className="px-3 text-xs font-medium text-muted-foreground">{group.title}</p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${tab === item.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </Card>
      </aside>
      <section className="min-w-0">
        {tab === "overview" ? <AccountOverviewPanel /> : null}
        {tab === "profile" ? <ProfileForm /> : null}
        {tab === "trainings" ? <Panel title="我的培训" description="已报名的培训项目。"><MyTrainingsPanel /></Panel> : null}
        {tab === "courses" ? <Panel title="我的课程" description="继续上课或查看学习进度。"><MyCoursesPanel /></Panel> : null}
        {tab === "favorites" ? <Panel title="我的收藏" description="收藏的课程与培训。"><MyFavoritesPanel /></Panel> : null}
        {tab === "classes" ? <Panel title="我的班级" description="已加入的培训班级。"><MyClassesPanel /></Panel> : null}
        {tab === "homeworks" ? <Panel title="我的作业" description="按作业作答、查看批改结果。"><MyHomeworksPanel /></Panel> : null}
        {tab === "exams" ? <Panel title="我的考试" description="进入考场或查看成绩。"><MyExamsPanel /></Panel> : null}
      </section>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
