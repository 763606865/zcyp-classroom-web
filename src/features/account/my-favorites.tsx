"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { MyFavoriteItem } from "@/entities/classroom";
import { unfavoriteCourse } from "@/features/learn/api";
import { formatDateTime, formatPrice, trainingTypeLabels } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyFavorites } from "./api";

type TypeFilter = "" | "course" | "training";

const typeFilters: { id: TypeFilter; label: string }[] = [
  { id: "", label: "全部" },
  { id: "course", label: "课程" },
  { id: "training", label: "培训" },
];

const PER_PAGE = 15;

function hrefFor(item: MyFavoriteItem) {
  if (item.type === "course" && item.course) return `/account/courses/${item.course.id}`;
  if (item.type === "training" && item.training) return `/trainings/${item.training.slug}`;
  return null;
}

function titleFor(item: MyFavoriteItem) {
  if (item.course?.title) return item.course.title;
  if (item.training?.title) return item.training.title;
  return "内容已下架";
}

export function MyFavoritesPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<MyFavoriteItem[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [busyId, setBusyId] = useState<number>();

  useEffect(() => {
    let cancelled = false;
    void getMyFavorites({ type: typeFilter || undefined, per_page: PER_PAGE, page })
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
  }, [typeFilter, page]);

  function handleFilterChange(filter: TypeFilter) {
    setTypeFilter(filter);
    setPage(1);
    setLoading(true);
    setError(undefined);
  }

  async function handleUnfavorite(item: MyFavoriteItem) {
    if (item.type !== "course" || !item.course) return;
    setBusyId(item.id);
    try {
      await unfavoriteCourse(item.course.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setTotal((value) => Math.max(0, value - 1));
    } catch (err) {
      toast({ title: "取消收藏失败", description: getApiErrorMessage(err) });
    } finally {
      setBusyId(undefined);
    }
  }

  if (error) return <EmptyState title="无法加载收藏" description={error} />;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        {typeFilters.map((filter) => (
          <button
            key={filter.id || "all"}
            type="button"
            onClick={() => handleFilterChange(filter.id)}
            className={`rounded-md px-3 py-1 text-sm ${typeFilter === filter.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="还没有收藏" description="在课程学习页点击收藏后，会显示在这里。" />
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((item) => {
              const href = hrefFor(item);
              const cover = item.course?.cover ?? item.training?.cover;
              const typeLabel = item.type === "course" ? "课程" : item.type === "training" ? "培训" : "已失效";
              return (
                <Card key={item.id} className="flex flex-wrap gap-4 p-4">
                  <CoverImage src={cover} alt="" className="h-20 w-32 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link href={href} className="font-semibold hover:text-primary">{titleFor(item)}</Link>
                    ) : (
                      <p className="font-semibold text-muted-foreground">{titleFor(item)}</p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {typeLabel}
                      {item.course?.teacher?.name ? ` · ${item.course.teacher.name}` : ""}
                      {item.training ? ` · ${trainingTypeLabels[item.training.type] ?? item.training.type}` : ""}
                      {item.training?.class?.name ? ` · ${item.training.class.name}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      收藏于 {formatDateTime(item.favorited_at)}
                      {item.course ? ` · ${formatPrice(item.course.is_free, item.course.price)}` : ""}
                      {item.training ? ` · ${formatPrice(item.training.is_free, item.training.price)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {href ? (
                      <Link
                        href={href}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        {item.type === "training" ? "查看培训" : "去上课"}
                      </Link>
                    ) : null}
                    {item.type === "course" && item.course ? (
                      <Button
                        variant="ghost"
                        loading={busyId === item.id}
                        onClick={() => void handleUnfavorite(item)}
                      >
                        取消收藏
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
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
