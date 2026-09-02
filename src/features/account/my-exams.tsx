"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyExam } from "@/entities/classroom";
import { examProgressLabel, formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyExams } from "./api";

type StatusFilter = "" | "pending" | "in_progress" | "submitted" | "scored" | "timeout";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "", label: "全部" },
  { id: "pending", label: "未开始" },
  { id: "in_progress", label: "作答中" },
  { id: "submitted", label: "待阅卷" },
  { id: "scored", label: "已出分" },
  { id: "timeout", label: "已超时" },
];

function actionLabel(item: MyExam) {
  if (item.progress_status === "in_progress") return "继续考试";
  if (item.can_start && item.progress_status === "pending") return "进入考场";
  if (item.can_start) return "再考一次";
  if (item.progress_status === "scored") return "查看成绩";
  return "查看考试";
}

function relationText(item: MyExam) {
  return [item.class?.name, item.course?.title, item.training?.title].filter(Boolean).join(" · ");
}

function durationText(minutes?: number | null) {
  if (minutes == null || minutes <= 0) return "不限时";
  return `${minutes} 分钟`;
}

export function MyExamsPanel() {
  const [items, setItems] = useState<MyExam[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void getMyExams({ status: status || undefined, page, per_page: 15 })
      .then((result) => {
        if (cancelled) return;
        setItems(result.data.data);
        setLastPage(result.data.last_page ?? 1);
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, page]);

  function handleFilter(next: StatusFilter) {
    setStatus(next);
    setPage(1);
    setLoading(true);
    setError(undefined);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((item) => (
          <button
            key={item.id || "all"}
            type="button"
            onClick={() => handleFilter(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${status === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {loading ? <Spinner label="加载我的考试" /> : null}
      {!loading && error ? <EmptyState title="无法加载考试" description={error} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="还没有考试" description="有权限的待考和已交卷记录会出现在这里。" />
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const writable = item.progress_status === "in_progress" || Boolean(item.can_start);
            return (
              <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/account/exams/${item.id}`} className="font-semibold hover:text-primary">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {relationText(item) || "未关联课程"}
                    {item.question_count ? ` · ${item.question_count} 题` : ""}
                    {` · ${durationText(item.duration_minutes)}`}
                    {item.end_at ? ` · 截止 ${formatDateTime(item.end_at)}` : ""}
                  </p>
                  {item.attempt?.score != null ? (
                    <p className="mt-1 text-sm">
                      得分 {item.attempt.score}{item.total_score != null ? ` / ${item.total_score}` : ""}
                      {item.attempt.is_passed == null ? "" : item.attempt.is_passed ? " · 已通过" : " · 未通过"}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{examProgressLabel(item.progress_status)}</span>
                  <Link href={`/account/exams/${item.id}`}>
                    <Button variant={writable ? "primary" : "secondary"}>{actionLabel(item)}</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
      {lastPage > 1 && !loading ? (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setLoading(true); }}>上一页</Button>
          <Button variant="secondary" disabled={page >= lastPage} onClick={() => { setPage((value) => value + 1); setLoading(true); }}>下一页</Button>
        </div>
      ) : null}
    </div>
  );
}
