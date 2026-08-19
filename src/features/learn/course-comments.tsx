"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { CourseComment } from "@/entities/learn";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDateTime } from "@/features/classroom/labels";
import { applyApiFieldErrors, getApiErrorMessage } from "@/lib/forms";
import { getCourseComments, submitCourseComment } from "./api";

const commentFormSchema = z.object({
  rating: z.number().min(1, "请选择评分").max(5),
  content: z.string().trim().min(5, "评论至少 5 个字").max(1000, "评论最多 1000 个字"),
  is_anonymous: z.boolean(),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

function commentAuthor(item: CourseComment) {
  if (item.is_anonymous || !item.user) return "匿名学员";
  return item.user.nick_name || item.user.real_name || item.user.name || "学员";
}

function Stars({ value, onChange }: { value: number; onChange?: (value: number) => void }) {
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : "img"} aria-label={`${value} 星`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={`text-lg ${star <= value ? "text-accent" : "text-muted-foreground"} ${onChange ? "cursor-pointer" : "cursor-default"}`}
          aria-label={`${star} 星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function CourseComments({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CourseComment[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { rating: 5, content: "", is_anonymous: false },
  });

  async function load(nextPage = 1, append = false) {
    const result = await getCourseComments(courseId, nextPage);
    const comments = result.data.comments;
    setItems((current) => append ? [...current, ...comments.data] : comments.data);
    setPage(comments.current_page);
    setLastPage(comments.last_page ?? Math.max(1, Math.ceil(comments.total / comments.per_page)));
    setTotal(result.data.summary?.total ?? result.data.summary?.count ?? comments.total);
    const avg = result.data.summary?.average_rating ?? result.data.summary?.avg_rating;
    setAverage(avg == null || avg === "" ? undefined : String(avg));
    const mine = comments.data.find((item) => item.user?.id === user?.id);
    if (mine && !append) {
      form.reset({
        rating: mine.rating,
        content: mine.content,
        is_anonymous: Boolean(mine.is_anonymous),
      });
      setEditing(true);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load(1)
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "评论加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅随课程变化重新加载
  }, [courseId]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await submitCourseComment(courseId, values);
      toast({ title: editing ? "评论已更新" : "评论已提交" });
      setEditing(true);
      await load(1);
    } catch (err) {
      if (!applyApiFieldErrors(err, form.setError)) {
        form.setError("content", { type: "server", message: getApiErrorMessage(err, "评论提交失败") });
      }
    }
  });

  return (
    <Card className="mt-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">课程评论</h2>
        <p className="text-sm text-muted-foreground">
          {total} 条{average ? ` · 均分 ${Number(average).toFixed(1)}` : ""}
        </p>
      </div>

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <FormField id="rating" label="评分" error={form.formState.errors.rating?.message}>
          <Stars value={form.watch("rating")} onChange={(value) => form.setValue("rating", value, { shouldValidate: true })} />
        </FormField>
        <FormField id="content" label={editing ? "修改我的评论" : "写评论"} error={form.formState.errors.content?.message}>
          <Textarea id="content" maxLength={1000} placeholder="至少 5 个字，分享你的学习体验" {...form.register("content")} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.watch("is_anonymous")}
            onCheckedChange={(checked) => form.setValue("is_anonymous", checked === true)}
          />
          匿名展示
        </label>
        <div>
          <Button type="submit" loading={form.formState.isSubmitting}>{editing ? "更新评论" : "发布评论"}</Button>
        </div>
      </form>

      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <div className="mt-6 grid gap-4">
        {loading ? <p className="text-sm text-muted-foreground">正在加载评论…</p> : null}
        {!loading && items.length === 0 ? <p className="text-sm text-muted-foreground">还没有评论，来写第一条吧。</p> : null}
        {items.map((item) => (
          <article key={item.id} className="border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{commentAuthor(item)}</p>
              <Stars value={item.rating} />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.content}</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
          </article>
        ))}
      </div>
      {page < lastPage ? (
        <Button
          className="mt-4"
          variant="secondary"
          loading={loadingMore}
          onClick={() => {
            setLoadingMore(true);
            void load(page + 1, true).finally(() => setLoadingMore(false));
          }}
        >
          加载更多
        </Button>
      ) : null}
    </Card>
  );
}
