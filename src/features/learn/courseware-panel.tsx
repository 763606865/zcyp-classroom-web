"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Courseware } from "@/entities/learn";
import { getApiErrorMessage } from "@/lib/forms";
import { getCoursewares } from "./api";

function formatFileSize(bytes?: number | null) {
  if (bytes == null || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function priceLabel(item: Courseware) {
  if (item.acquisition_type !== "paid") return "免费";
  const price = item.price == null || item.price === "" ? "" : `¥${item.price}`;
  return price || "付费";
}

function canDownload(item: Courseware) {
  return Boolean(item.download_url) && item.can_acquire !== false;
}

function CoursewareRow({ item }: { item: Courseware }) {
  const locked = item.requires_purchase || !canDownload(item);
  const meta = [
    item.file_type?.toUpperCase(),
    formatFileSize(item.file_size),
    item.original_name && item.original_name !== item.title ? item.original_name : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="font-medium">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.lesson?.title ? `${item.lesson.title} · ` : "课程通用 · "}
          {priceLabel(item)}
          {meta ? ` · ${meta}` : ""}
        </p>
        {item.description ? <p className="mt-1 text-xs text-muted-foreground">{item.description}</p> : null}
      </div>
      {canDownload(item) ? (
        <a href={item.download_url ?? undefined} target="_blank" rel="noreferrer">
          <Button>下载</Button>
        </a>
      ) : locked && item.acquisition_type === "paid" ? (
        <Button variant="secondary" disabled>{priceLabel(item)} 未购买</Button>
      ) : (
        <Button variant="secondary" disabled>暂不可下载</Button>
      )}
    </div>
  );
}

export function CoursewarePanel({ courseId, lessonId }: { courseId: number; lessonId?: number }) {
  const [items, setItems] = useState<Courseware[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getCoursewares(courseId)
      .then((result) => {
        if (!cancelled) setItems(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "课件加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const lessonItems = useMemo(
    () => items.filter((item) => item.lesson?.id === lessonId),
    [items, lessonId],
  );
  const courseItems = useMemo(
    () => items.filter((item) => item.lesson == null),
    [items],
  );
  const otherItems = useMemo(
    () => items.filter((item) => item.lesson != null && item.lesson.id !== lessonId),
    [items, lessonId],
  );

  if (loading || (items.length === 0 && !error)) {
    return null;
  }

  return (
    <Card className="mt-0 p-4">
      <h2 className="font-semibold">课程课件</h2>
      {error ? <p className="mt-2 text-sm text-muted-foreground">{error}</p> : null}
      <div className="mt-4 grid gap-4">
        {lessonItems.length > 0 ? (
          <section>
            <p className="mb-2 text-xs font-medium text-muted-foreground">本课课件</p>
            <div className="grid gap-2">{lessonItems.map((item) => <CoursewareRow key={item.id} item={item} />)}</div>
          </section>
        ) : null}
        {courseItems.length > 0 ? (
          <section>
            <p className="mb-2 text-xs font-medium text-muted-foreground">课程通用</p>
            <div className="grid gap-2">{courseItems.map((item) => <CoursewareRow key={item.id} item={item} />)}</div>
          </section>
        ) : null}
        {otherItems.length > 0 ? (
          <section>
            <p className="mb-2 text-xs font-medium text-muted-foreground">其他课时课件</p>
            <div className="grid gap-2">{otherItems.map((item) => <CoursewareRow key={item.id} item={item} />)}</div>
          </section>
        ) : null}
      </div>
      {items.some((item) => item.acquisition_type === "paid" && !canDownload(item)) ? (
        <p className="mt-3 text-xs text-muted-foreground">付费课件需单独购买后才能下载，购买能力接入后即可解锁。</p>
      ) : null}
    </Card>
  );
}
