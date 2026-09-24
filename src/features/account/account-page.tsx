"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CoverImage } from "@/components/cover-image";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyClass, MyCourse, MyTraining } from "@/entities/classroom";
import { statusLabel, trainingTypeColors, trainingTypeLabels } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { ProfileForm } from "@/features/user/profile-form";
import { getMyClasses, getMyCourses, getMyTrainings } from "./api";
import { AccountShell, type AccountTab } from "./account-shell";
import { AccountOverviewPanel } from "./account-overview";
import { MyExamsPanel } from "./my-exams";
import { MyFavoritesPanel } from "./my-favorites";
import { MyHomeworksPanel } from "./my-homeworks";

const tabIds: AccountTab[] = ["overview", "trainings", "courses", "favorites", "classes", "homeworks", "exams", "profile"];

function normalizeTab(value: string | null): AccountTab {
  return value && (tabIds as string[]).includes(value) ? (value as AccountTab) : "overview";
}

export function AccountPageView() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<AccountTab>(() => normalizeTab(searchParams.get("tab")));

  return (
    <AccountShell
      active={tab}
      onNavigate={setTab}
      contentClassName={tab === "profile" ? "bg-transparent border-0" : "bg-white"}
    >
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
    </AccountShell>
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

  if (loading) return <div className="flex min-h-[220px] items-center justify-center"><Spinner label="加载我的培训" /></div>;
  if (error) return <EmptyState title="无法加载我的培训" description={error} />;
  if (items.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
        <img src="/images/personal/study-emty.png" alt="" className="h-[75px] w-[92px]" width={92} height={75} />
        <p className="mt-4 text-sm" style={{ color: "#555" }}>暂无培训项目</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <TrainingCardItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function TrainingCardItem({ item }: { item: MyTraining }) {
  const training = item.training;
  const typeColor = trainingTypeColors[training.type] ?? "#555";
  const typeLabel = trainingTypeLabels[training.type] ?? training.type;
  const teachers = (training as Record<string, unknown>).teachers as
    | { name?: string }[]
    | undefined;
  const teacherName = teachers?.[0]?.name ?? training.category?.name ?? "";

  return (
    <Link href={`/account/trainings/${training.slug}`} className="group block overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md" style={{ borderColor: "#ECECEC" }}>
      {/* 图片区 */}
      <div className="relative w-full overflow-hidden rounded-t-lg" style={{ paddingBottom: "56.25%" }}>
        <CoverImage
          src={training.cover}
          alt={training.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {/* 数据区 */}
      <div style={{ padding: "13px 16px 11px" }}>
        {/* 标题 */}
        <h3
          className="line-clamp-2 font-medium"
          style={{ fontSize: 16, lineHeight: "24px", color: "#222", minHeight: "48px" }}
        >
          {training.title}
        </h3>
        {/* 讲师 + 授课方式 */}
        <div className="mt-[9px] flex items-center justify-between">
          {teacherName ? (
            <span style={{ fontSize: 14, color: "#555" }}>讲师{teacherName}</span>
          ) : <span />}
          <span style={{ fontSize: 14, color: typeColor }}>
            授课方式：{typeLabel}
          </span>
        </div>
        {/* 分割线 */}
        <div
          className="mt-[6px]"
          style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }}
        />
        {/* 已报名 + 查看详情 */}
        <div className="mt-[7px] flex items-center justify-between">
          <span style={{ fontSize: 14, color: "#25B270" }}>已报名</span>
          <span
            className="inline-flex items-center rounded"
            style={{
              height: 24,
              padding: "0 8px",
              fontSize: 14,
              color: "#0F62FE",
              border: "1px solid #0F62FE",
              backgroundColor: "transparent",
            }}
          >
            查看详情
          </span>
        </div>
      </div>
    </Link>
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

  if (loading) return <div className="flex min-h-[220px] items-center justify-center"><Spinner label="加载我的课程" /></div>;
  if (error) return <EmptyState title="无法加载我的课程" description={error} />;
  if (items.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
        <img src="/images/personal/study-emty.png" alt="" className="h-[75px] w-[92px]" width={92} height={75} />
        <p className="mt-4 text-sm" style={{ color: "#555" }}>暂无课程项目</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-y-[25px] gap-x-[27px] sm:grid-cols-2">
      {items.map((item) => (
        <CourseCardItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function CourseCardItem({ item }: { item: MyCourse }) {
  const progress = item.progress ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#ECECEC", background: "#fff" }}>
      {/* 头部数据区 */}
      <div className="flex" style={{ padding: "8px 16px 12px 10px" }}>
        <CoverImage src={item.course.cover} alt="" className="h-[98px] w-[168px] shrink-0 rounded-md object-cover" />
        <div className="ml-[10px] min-w-0 flex-1">
          <Link href={`/account/courses/${item.course.id}`} className="line-clamp-2 text-lg font-semibold hover:text-primary" style={{ color: "#222" }}>
            {item.course.title}
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: "#999" }}>学习进度</span>
            <span className="text-sm tabular-nums">
              <span style={{ color: "#1667FE" }}>{progress}</span>
              <span style={{ color: "#222" }}>/100</span>
            </span>
          </div>
          {/* 进度条 */}
          <div className="mt-[5px] h-[9px] overflow-hidden rounded-[10px]" style={{ background: "#F4F4F4" }}>
            <div
              className="h-full rounded-[10px]"
              style={{
                width: `${Math.min(100, progress)}%`,
                background: "linear-gradient( 90deg, #6FA1FF 0%, #0F62FE 100%)",
              }}
            />
          </div>
        </div>
      </div>
      {/* 底部按钮 */}
      <div className="flex" style={{ borderTop: "1px solid #ECECEC" }}>
        <Link
          href={`/account/courses/${item.course.id}`}
          className="flex h-[41px] flex-1 items-center justify-center text-sm"
          style={{ color: "#0F62FE", background: "#F6F8FC" }}
        >
          继续学习
        </Link>
        <div className="my-[8px] w-px" style={{ background: "#DBDBDB", height: "25px", alignSelf: "center" }} />
        <button
          type="button"
          className="flex h-[41px] flex-1 items-center justify-center text-sm"
          style={{ color: "#F16767", background: "#F6F8FC" }}
        >
          立即删除
        </button>
      </div>
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
