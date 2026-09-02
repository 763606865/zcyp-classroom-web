"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ClassSchedule } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getClassSchedules } from "./api";
import { classScheduleStatusLabel, formatDate, formatPrice, trainingTypeLabels } from "./labels";
import { scheduleTopicMock } from "./topic-mock";
import { TopicChip, TopicHero, TopicSection } from "./topic-chrome";
import { TopicPager } from "./topic-pager";

function CalendarMock() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);
  const highlight = new Set(scheduleTopicMock.calendarHighlightDays);
  return (
    <div className="rounded-2xl bg-white p-5 text-foreground">
      <p className="text-sm font-medium">{scheduleTopicMock.calendarMonth}</p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["日", "一", "二", "三", "四", "五", "六"].map((item) => <span key={item}>{item}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((day) => (
          <span
            key={day}
            className={`flex size-8 items-center justify-center justify-self-center rounded-full ${highlight.has(day) ? "bg-primary text-primary-foreground" : ""}`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ClassSchedulesView() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [location, setLocation] = useState("全国");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [items, setItems] = useState<ClassSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getClassSchedules({
        q: keyword.trim() || undefined,
        status: status === "upcoming" ? undefined : status,
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
          if (!cancelled) setError(getApiErrorMessage(err, "开班计划加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, status, page]);

  const visibleItems = useMemo(() => {
    if (location === "全国") return items;
    return items.filter((item) => (item.training?.location ?? "").includes(location));
  }, [items, location]);

  const statusTabs = [
    { id: "upcoming", label: "待开班 / 进行中" },
    { id: "pending", label: "待开班" },
    { id: "ongoing", label: "进行中" },
    { id: "finished", label: "已结班" },
  ];

  return (
    <div>
      <TopicHero
        title="开班计划"
        subtitle={scheduleTopicMock.heroSubtitle}
        stats={scheduleTopicMock.stats}
        aside={<CalendarMock />}
      />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4">
          <Input
            value={keyword}
            onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
            placeholder="搜索班级、编码或培训标题"
            aria-label="搜索开班计划"
            className="sm:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((item) => (
              <TopicChip key={item.id} active={status === item.id} onClick={() => { setStatus(item.id); setPage(1); }}>{item.label}</TopicChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {scheduleTopicMock.locations.map((item) => (
              <TopicChip key={item} active={location === item} onClick={() => setLocation(item)}>{item}</TopicChip>
            ))}
          </div>
        </div>
      </div>
      <TopicSection title="近期班级">
        {loading ? <div className="flex justify-center py-16"><Spinner label="加载开班计划" /></div> : null}
        {!loading && error ? <EmptyState title="无法加载开班计划" description={error} /> : null}
        {!loading && !error && visibleItems.length === 0 ? <EmptyState title="暂无开班安排" description="可以先浏览培训项目或提交咨询。" /> : null}
        {!loading && !error && visibleItems.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">共 {location === "全国" ? total : visibleItems.length} 个班级</p>
            <div className="grid gap-4">
              {visibleItems.map((item) => {
                const training = item.training;
                return (
                  <Card key={item.id} className="flex flex-col overflow-hidden p-0 sm:flex-row">
                    <CoverImage src={item.cover || training?.cover} alt="" className="h-40 w-full sm:h-auto sm:w-56" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={item.status === "ongoing" ? "text-accent" : "text-primary"}>{classScheduleStatusLabel(item.status)}</span>
                        {training ? <span className="text-muted-foreground">· {trainingTypeLabels[training.type] ?? training.type}</span> : null}
                        {item.code ? <span className="text-muted-foreground">· {item.code}</span> : null}
                      </div>
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      {training ? <p className="text-sm text-muted-foreground">所属培训：{training.title}</p> : null}
                      <p className="text-sm text-muted-foreground">
                        {formatDate(item.start_at)} — {formatDate(item.end_at)}
                        {training?.location ? ` · ${training.location}` : ""}
                        {item.teacher?.name ? ` · ${item.teacher.name}` : ""}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                        <p className="text-sm">
                          {item.student_count ?? 0}/{item.max_students ?? "—"} 人
                          {training ? <span className="ml-3 font-medium text-primary">{formatPrice(training.is_free, training.price)}</span> : null}
                        </p>
                        {training ? (
                          <Link href={`/trainings/${training.slug}`} className="inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">报名 / 试听</Link>
                        ) : (
                          <Link href="/consult?source=schedule" className="inline-flex min-h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">咨询开班</Link>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <TopicPager page={page} lastPage={lastPage} loading={loading} onPageChange={setPage} />
          </>
        ) : null}
      </TopicSection>
      <TopicSection title="开班流程">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scheduleTopicMock.steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-primary">0{index + 1}</p>
              <p className="mt-2 font-medium">{step.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>
      </TopicSection>
      <TopicSection title="报名须知">
        <div className="grid gap-3">
          {scheduleTopicMock.notices.map((item) => (
            <Card key={item.q} className="p-5">
              <p className="font-medium">{item.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </Card>
          ))}
        </div>
      </TopicSection>
      <section className="bg-[#0b1f44] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-10">
          <div>
            <p className="text-xl font-semibold">企业团报与上门内训</p>
            <p className="mt-2 text-sm text-white/70">提交咨询后由教务对接班级、地点与排期。</p>
          </div>
          <Link href="/consult?source=schedule-group" className="inline-flex min-h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover">联系教务</Link>
        </div>
      </section>
    </div>
  );
}
