"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { MyPracticeRecord } from "@/entities/learn";
import { formatDateTime } from "@/features/classroom/labels";
import { getMyPractices } from "./api";
import { getApiErrorMessage } from "@/lib/forms";

type StatusFilter = "" | "in_progress" | "completed";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "", label: "全部" },
  { id: "in_progress", label: "练习中" },
  { id: "completed", label: "已完成" },
];

const PER_PAGE = 15;

export function MyPracticesPanel() {
  const [items, setItems] = useState<MyPracticeRecord[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void getMyPractices({ status: statusFilter || undefined, per_page: PER_PAGE, page })
      .then((result) => {
        if (!cancelled) {
          setItems(result.data.data);
          setTotal(result.data.total);
          setLastPage(result.data.last_page ?? 1);
        }
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  function handleFilterChange(filter: StatusFilter) {
    setStatusFilter(filter);
    setPage(1);
    setLoading(true);
    setError(undefined);
  }

  if (error) return <EmptyState title="无法加载练习记录" description={error} />;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => handleFilterChange(filter.id)}
            className={`rounded-md px-3 py-1 text-sm ${statusFilter === filter.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="还没有练习记录" description="去课程中完成课后练习吧。" />
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.practice?.title ?? "未知练习"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.practice?.course?.title ?? ""}
                    {item.practice?.course?.title ? " · " : ""}
                    第 {item.attempt_no} 次练习
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.score != null ? `得分 ${item.score}` : "暂无分数"}
                    {" · "}
                    正确 {item.correct_count}/{item.answered_count} 题
                    {" · "}
                    {formatDateTime(item.started_at)}
                  </p>
                </div>
                <span className="text-sm">{item.status}</span>
              </Card>
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="rounded-md px-3 py-1 text-sm disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {lastPage} 共 {total} 条
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.min(lastPage, p + 1));
                }}
                className="rounded-md px-3 py-1 text-sm disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
