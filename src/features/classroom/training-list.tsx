"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { TrainingCard } from "@/entities/classroom";
import { getApiErrorMessage } from "@/lib/forms";
import { getTrainings } from "./api";
import { TrainingCardItem } from "./training-card";

export function TrainingListView() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all");
  const [items, setItems] = useState<TrainingCard[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void getTrainings({
        q: keyword.trim() || undefined,
        type: type === "all" ? undefined : type,
      })
        .then((result) => {
          if (cancelled) return;
          setItems(result.data.data);
          setTotal(result.data.total);
          setError(undefined);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(getApiErrorMessage(err, "培训列表加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, type]);

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">培训项目</h1>
        <p className="mt-3 text-muted-foreground">浏览可报名的线上、线下与混合式培训，查看详情后即可报名。</p>
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索培训标题或简介"
          aria-label="搜索培训"
          className="sm:max-w-sm"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-40" aria-label="培训类型">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="online">线上</SelectItem>
            <SelectItem value="offline">线下</SelectItem>
            <SelectItem value="mixed">混合</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner label="加载培训列表" /></div>
      ) : error ? (
        <EmptyState title="无法加载培训" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="没有匹配的培训" description="试试更换关键词或类型。" />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">共 {total} 个项目</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((training) => (
              <TrainingCardItem key={training.id} training={training} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
