"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { TeacherProfile } from "@/entities/classroom";
import { UserAvatar, avatarImageSrc } from "@/features/user/user-avatar";
import { getApiErrorMessage } from "@/lib/forms";
import { getTeacher } from "./api";
import { CourseCardItem } from "./course-card";
import { stripHtml } from "./labels";
import { TrainingCardItem } from "./training-card";

export function TeacherDetailView({ teacherId }: { teacherId: number }) {
  const [item, setItem] = useState<TeacherProfile>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getTeacher(teacherId)
      .then((result) => { if (!cancelled) setItem(result.data); })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err, "师资详情加载失败")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teacherId]);

  if (!Number.isFinite(teacherId) || teacherId <= 0) {
    return <EmptyState title="师资不存在" action={<Link href="/teachers" className="text-sm text-primary">返回师资力量</Link>} />;
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner label="加载师资详情" /></div>;
  if (error || !item) {
    return <EmptyState title="无法打开师资详情" description={error} action={<Link href="/teachers" className="text-sm text-primary">返回师资力量</Link>} />;
  }

  const courses = item.courses ?? [];
  const trainings = item.trainings ?? [];

  return (
    <div className="grid gap-8">
      <Link href="/teachers" className="text-sm text-primary">返回师资力量</Link>
      <Card className="flex flex-col gap-6 p-6 sm:flex-row">
        <UserAvatar name={item.name} src={avatarImageSrc(item.avatar)} className="size-28 text-3xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
          <p className="mt-2 text-primary">{item.title ?? "讲师"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{[item.organization, item.expertise].filter(Boolean).join(" · ")}</p>
          {stripHtml(item.bio) ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{stripHtml(item.bio)}</p> : null}
          <Link href={`/consult?source=teacher&teacher=${item.id}`} className="mt-6 inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">
            预约试听
          </Link>
        </div>
      </Card>
      <section>
        <h2 className="text-xl font-semibold">主讲课程</h2>
        {courses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">暂无公开主讲课程。</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => <CourseCardItem key={course.id} course={course} />)}
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold">关联培训</h2>
        {trainings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">暂无关联培训。</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainings.map((training) => <TrainingCardItem key={training.id} training={training} />)}
          </div>
        )}
      </section>
    </div>
  );
}
