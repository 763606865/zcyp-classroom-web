"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyClass, MyCourse, MyTraining } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDateTime, statusLabel } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { ProfileForm } from "@/features/user/profile-form";
import { getMyClasses, getMyCourses, getMyTrainings } from "./api";
import { MyExamsPanel } from "./my-exams";
import { MyFavoritesPanel } from "./my-favorites";
import { MyHomeworksPanel } from "./my-homeworks";

type Tab = "profile" | "trainings" | "courses" | "favorites" | "classes" | "homeworks" | "exams";

const tabs: { id: Tab; label: string }[] = [
  { id: "profile", label: "资料" },
  { id: "trainings", label: "我的培训" },
  { id: "courses", label: "我的课程" },
  { id: "favorites", label: "我的收藏" },
  { id: "classes", label: "我的班级" },
  { id: "homeworks", label: "我的作业" },
  { id: "exams", label: "我的考试" },
];

export function AccountPageView() {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/account");
  }, [router, status]);

  if (status === "loading" || status === "anonymous" || !user) {
    return <div className="flex justify-center py-20"><Spinner label="加载个人中心" /></div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="grid h-fit gap-2">
        <Card className="p-4">
          <p className="font-semibold">{user.nick_name ?? user.real_name ?? "学员"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{user.phone}</p>
        </Card>
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-md px-4 py-2 text-left text-sm ${tab === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {item.label}
          </button>
        ))}
        <button type="button" onClick={logout} className="rounded-md px-4 py-2 text-left text-sm text-danger hover:bg-muted">
          退出登录
        </button>
      </aside>
      <section>
        {tab === "profile" ? <ProfileForm /> : null}
        {tab === "trainings" ? <MyTrainingsPanel /> : null}
        {tab === "courses" ? <MyCoursesPanel /> : null}
        {tab === "favorites" ? <MyFavoritesPanel /> : null}
        {tab === "classes" ? <MyClassesPanel /> : null}
        {tab === "homeworks" ? <MyHomeworksPanel /> : null}
        {tab === "exams" ? <MyExamsPanel /> : null}
      </section>
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
