"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { CourseCard } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getHotCourses } from "./api";
import { CourseCardItem } from "./course-card";
import { formatPrice, trainingTypeLabels } from "./labels";
import { courseTopicMock } from "./topic-mock";
import { TopicChip, TopicHero, TopicSection } from "./topic-chrome";
import { TopicPager } from "./topic-pager";

export function HotCoursesView() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all");
  const [direction, setDirection] = useState("all");
  const [featured, setFeatured] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [items, setItems] = useState<CourseCard[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getHotCourses({
        q: keyword.trim() || undefined,
        type: type === "all" ? undefined : type,
        featured: featured === "featured" ? true : undefined,
        page,
      })
        .then((result) => {
          if (cancelled) return;
          setItems(result.data.data);
          setTotal(result.data.total);
          setLastPage(result.data.last_page ?? 1);
          setError(undefined);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(getApiErrorMessage(err, "课程列表加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, type, featured, page]);

  const featuredCourse = useMemo(
    () => items.find((item) => item.is_featured) ?? items[0],
    [items],
  );

  return (
    <div>
      <TopicHero
        title="热门课程"
        subtitle={courseTopicMock.heroSubtitle}
        stats={courseTopicMock.stats}
        aside={
          <div className="overflow-hidden rounded-2xl bg-white/10 p-6">
            <p className="text-lg font-semibold">{courseTopicMock.heroNote}</p>
            <p className="mt-2 text-sm text-white/75">{courseTopicMock.heroTagline}</p>
            <p className="mt-6 text-sm text-white/70">专业的计量检测人才培养平台</p>
          </div>
        }
      />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center">
          <Input
            value={keyword}
            onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
            placeholder="搜索课程"
            aria-label="搜索课程"
            className="lg:max-w-xs"
          />
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <TopicChip active={direction === "all"} onClick={() => setDirection("all")}>全部</TopicChip>
            {courseTopicMock.directions.map((item) => (
              <TopicChip key={item.id} active={direction === item.id} onClick={() => setDirection(item.id)}>{item.label}</TopicChip>
            ))}
          </div>
          <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}>
            <SelectTrigger className="lg:w-36" aria-label="课程类型"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="online">线上</SelectItem>
              <SelectItem value="offline">线下</SelectItem>
              <SelectItem value="live">直播</SelectItem>
              <SelectItem value="mixed">混合</SelectItem>
            </SelectContent>
          </Select>
          <Select value={featured} onValueChange={(value) => { setFeatured(value); setPage(1); }}>
            <SelectTrigger className="lg:w-32" aria-label="推荐筛选"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部课程</SelectItem>
              <SelectItem value="featured">仅推荐</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {featuredCourse ? (
        <TopicSection title="主编推荐">
          <Card className="grid overflow-hidden p-0 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <CoverImage src={featuredCourse.cover} alt="" className="h-48 w-full lg:h-full" />
            <div className="flex flex-col gap-3 p-6">
              <h3 className="text-2xl font-semibold">{featuredCourse.title}</h3>
              <p className="text-sm text-muted-foreground">
                {featuredCourse.teacher?.name ?? "中测讲师"}
                {featuredCourse.lesson_count ? ` · ${featuredCourse.lesson_count} 课时` : ""}
                {featuredCourse.type ? ` · ${trainingTypeLabels[featuredCourse.type] ?? featuredCourse.type}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {courseTopicMock.featuredTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary">{tag}</span>
                ))}
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{featuredCourse.summary || courseTopicMock.featuredSummary}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-lg font-semibold text-primary">{formatPrice(featuredCourse.is_free, featuredCourse.price)}</span>
                <Link href={`/consult?source=hot-course&course=${featuredCourse.id}`} className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">咨询课程</Link>
              </div>
            </div>
          </Card>
        </TopicSection>
      ) : null}
      <TopicSection title="岗位方向">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {courseTopicMock.directions.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDirection(item.id)}
              className={`rounded-xl border bg-surface px-3 py-6 text-center text-sm font-medium ${direction === item.id ? "border-primary text-primary" : "border-border"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </TopicSection>
      <TopicSection title="全部课程">
        {loading ? <div className="flex justify-center py-16"><Spinner label="加载热门课程" /></div> : null}
        {!loading && error ? <EmptyState title="无法加载课程" description={error} /> : null}
        {!loading && !error && items.length === 0 ? <EmptyState title="没有匹配的课程" description="试试更换关键词或筛选条件。" /> : null}
        {!loading && !error && items.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">共 {total} 门课程</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((course) => <CourseCardItem key={course.id} course={course} />)}
            </div>
            <TopicPager page={page} lastPage={lastPage} loading={loading} onPageChange={setPage} />
          </>
        ) : null}
      </TopicSection>
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
          <div>
            <h2 className="text-xl font-semibold">如何选课</h2>
            <p className="mt-2 text-sm text-muted-foreground">三步快速匹配适合你的课程</p>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {courseTopicMock.chooseSteps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-primary">0{index + 1} {step.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
          <Link href="/consult?source=hot-courses" className="flex min-h-32 flex-col justify-center rounded-2xl bg-accent p-6 text-white">
            <p className="text-xl font-semibold">免费咨询课程</p>
            <p className="mt-2 text-sm text-white/85">专业课程顾问为你服务</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
