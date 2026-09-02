"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyCourse, MyExam, MyHomework } from "@/entities/classroom";
import { formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyCourses, getMyExams, getMyFavorites, getMyHomeworks } from "./api";

const HOMEWORK_TODO = new Set(["pending", "draft", "returned"]);
const EXAM_TODO = new Set(["pending", "in_progress"]);

function homeworkAction(status: string) {
  if (status === "pending") return "开始作答";
  if (status === "draft") return "继续作答";
  return "重新作答";
}

function examAction(item: MyExam) {
  if (item.progress_status === "in_progress") return "继续考试";
  return "进入考场";
}

export function AccountOverviewPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [courseTotal, setCourseTotal] = useState(0);
  const [homeworkTotal, setHomeworkTotal] = useState(0);
  const [examTotal, setExamTotal] = useState(0);
  const [favoriteTotal, setFavoriteTotal] = useState(0);
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [homeworks, setHomeworks] = useState<MyHomework[]>([]);
  const [exams, setExams] = useState<MyExam[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getMyCourses("learning"),
      getMyHomeworks({ status: "pending", per_page: 5 }),
      getMyHomeworks({ status: "draft", per_page: 5 }),
      getMyHomeworks({ status: "returned", per_page: 5 }),
      getMyExams({ status: "pending", per_page: 5 }),
      getMyExams({ status: "in_progress", per_page: 5 }),
      getMyFavorites({ per_page: 1 }),
    ])
      .then(([courseResult, pendingHw, draftHw, returnedHw, pendingEx, progressEx, favoriteResult]) => {
        if (cancelled) return;
        const homeworkTodos = [...pendingHw.data.data, ...draftHw.data.data, ...returnedHw.data.data]
          .filter((item) => HOMEWORK_TODO.has(item.progress_status));
        const examTodos = [...pendingEx.data.data, ...progressEx.data.data]
          .filter((item) => EXAM_TODO.has(item.progress_status));
        setCourses(courseResult.data.data.slice(0, 2));
        setCourseTotal(courseResult.data.total);
        setHomeworks(homeworkTodos.slice(0, 3));
        setHomeworkTotal(pendingHw.data.total + draftHw.data.total + returnedHw.data.total);
        setExams(examTodos.slice(0, 3));
        setExamTotal(pendingEx.data.total + progressEx.data.total);
        setFavoriteTotal(favoriteResult.data.total);
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner label="加载学习概览" />;
  if (error) return <EmptyState title="无法加载概览" description={error} />;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">学习概览</h1>
        <p className="mt-1 text-sm text-muted-foreground">从这里继续上课、交作业或参加考试。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="进行中的课程" value={courseTotal} />
        <StatCard label="待交作业" value={homeworkTotal} />
        <StatCard label="待考考试" value={examTotal} />
        <StatCard label="收藏" value={favoriteTotal} />
      </div>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">继续学习</h2>
        {courses.length === 0 ? (
          <EmptyState title="暂无进行中的课程" description="报名培训或开通课程后会出现在这里。" action={<Link href="/trainings" className="text-sm text-primary">浏览培训</Link>} />
        ) : (
          courses.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center gap-4">
              <CoverImage src={item.course.cover} alt="" className="h-20 w-32 rounded-md" />
              <div className="min-w-0 flex-1">
                <Link href={`/account/courses/${item.course.id}`} className="font-semibold hover:text-primary">{item.course.title}</Link>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.progress ?? 0)}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">进度 {item.progress ?? 0}%</p>
              </div>
              <Link href={`/account/courses/${item.course.id}`} className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">去上课</Link>
            </Card>
          ))
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">待办</h2>
        {homeworks.length === 0 && exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无待办作业或考试。</p>
        ) : (
          <div className="grid gap-3">
            {homeworks.map((item) => (
              <Card key={`hw-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-xs text-muted-foreground">作业</p>
                  <p className="mt-1 font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-danger">截止 {formatDateTime(item.deadline_at)}</p>
                </div>
                <Link href={`/account/homeworks/${item.id}`} className="text-sm font-medium text-primary">{homeworkAction(item.progress_status)}</Link>
              </Card>
            ))}
            {exams.map((item) => (
              <Card key={`ex-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-xs text-muted-foreground">考试</p>
                  <p className="mt-1 font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">窗口至 {formatDateTime(item.end_at)}</p>
                </div>
                <Link href={`/account/exams/${item.id}`} className="text-sm text-primary">{examAction(item)}</Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-2xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
