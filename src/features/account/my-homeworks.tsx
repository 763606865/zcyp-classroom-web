"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyHomework } from "@/entities/classroom";
import { formatDateTime, homeworkProgressLabel } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyHomeworks } from "./api";

type StatusFilter = "" | "pending" | "draft" | "submitted" | "reviewed" | "returned";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "", label: "全部" },
  { id: "pending", label: "未开始" },
  { id: "draft", label: "草稿" },
  { id: "submitted", label: "待批改" },
  { id: "reviewed", label: "已批改" },
  { id: "returned", label: "已退回" },
];

function actionLabel(status: string) {
  if (status === "pending") return "开始作答";
  if (status === "draft") return "继续作答";
  if (status === "returned") return "重新作答";
  if (status === "reviewed") return "查看成绩";
  return "查看作业";
}

function relationText(item: MyHomework) {
  return [item.class?.name, item.course?.title, item.lesson?.title].filter(Boolean).join(" · ");
}

export function MyHomeworksPanel() {
  const [items, setItems] = useState<MyHomework[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void getMyHomeworks({ status: status || undefined, page, per_page: 15 })
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
      {loading ? <Spinner label="加载我的作业" /> : null}
      {!loading && error ? <EmptyState title="无法加载作业" description={error} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="还没有作业" description="有权限的待作答和已提交作业会出现在这里。" />
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const writable = item.progress_status === "pending" || item.progress_status === "draft" || item.progress_status === "returned";
            return (
              <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/account/homeworks/${item.id}`} className="font-semibold hover:text-primary">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {relationText(item) || "未关联课程"}
                    {item.question_count ? ` · ${item.question_count} 题` : ""}
                    {item.deadline_at ? ` · 截止 ${formatDateTime(item.deadline_at)}` : ""}
                  </p>
                  {item.submission?.score != null ? (
                    <p className="mt-1 text-sm">得分 {item.submission.score}{item.total_score != null ? ` / ${item.total_score}` : ""}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{homeworkProgressLabel(item.progress_status)}</span>
                  <Link href={`/account/homeworks/${item.id}`}>
                    <Button variant={writable ? "primary" : "secondary"}>
                      {actionLabel(item.progress_status)}
                    </Button>
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
