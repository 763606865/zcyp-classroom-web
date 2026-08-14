"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { ClassroomHome } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getClassroomHome } from "./api";
import { formatPrice, trainingTypeLabels } from "./labels";
import { TrainingCardItem } from "./training-card";

export function ClassroomHomeView() {
  const [home, setHome] = useState<ClassroomHome>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getClassroomHome()
      .then((result) => {
        if (!cancelled) setHome(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "首页内容加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载首页" /></div>;
  }

  if (error || !home) {
    return <EmptyState title="暂时无法加载首页" description={error} />;
  }

  const banner = home.banners[0];
  const introTrainings = home.featured_trainings.length > 0 ? home.featured_trainings : home.latest_trainings;

  return (
    <div className="grid gap-12">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="text-sm font-medium text-primary">在线培训平台</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {banner?.title ?? "系统化培训，面向一线岗位"}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              {banner?.summary ?? banner?.subtitle ?? "公开课、线下班与混合式培训一体，从报名、学习到考试形成完整闭环。"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trainings"><Button>浏览培训项目</Button></Link>
              <Link href="/login"><Button variant="secondary">短信登录</Button></Link>
            </div>
          </div>
          <CoverImage src={banner?.cover} alt="" className="min-h-56 w-full lg:min-h-full" />
        </div>
      </section>

      {home.banners.length > 1 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="推荐内容">
          {home.banners.slice(1).map((item) => (
            <Card key={item.id} className="overflow-hidden p-0">
              <CoverImage src={item.cover} alt="" className="h-28 w-full" />
              <div className="p-4">
                <h2 className="font-semibold">{item.title}</h2>
                {item.summary ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p> : null}
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">培训项目介绍</h2>
            <p className="mt-1 text-sm text-muted-foreground">精选与最新开班项目，覆盖计量、检测等岗位能力提升。</p>
          </div>
          <Link href="/trainings" className="text-sm font-medium text-primary">查看全部</Link>
        </div>
        {introTrainings.length === 0 ? (
          <EmptyState title="暂无公开培训" description="后台发布培训后将展示在这里。" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {introTrainings.map((training) => (
              <TrainingCardItem key={training.id} training={training} />
            ))}
          </div>
        )}
      </section>

      {home.featured_courses.length > 0 ? (
        <section>
          <h2 className="mb-6 text-2xl font-semibold">推荐课程</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.featured_courses.map((course) => (
              <Card key={course.id}>
                <p className="text-xs text-muted-foreground">
                  {trainingTypeLabels[course.type] ?? course.type}
                  {course.lesson_count != null ? ` · ${course.lesson_count} 课时` : ""}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{course.title}</h3>
                {course.summary ? <p className="mt-2 text-sm text-muted-foreground">{course.summary}</p> : null}
                {course.teacher ? <p className="mt-3 text-sm">讲师：{course.teacher.name}</p> : null}
                <p className="mt-4 font-medium text-primary">{formatPrice(course.is_free, course.price)}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
