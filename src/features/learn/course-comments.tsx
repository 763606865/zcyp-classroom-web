"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { CourseComment } from "@/entities/learn";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDateTime } from "@/features/classroom/labels";
import { applyApiFieldErrors, getApiErrorMessage } from "@/lib/forms";
import { getCourseComments, submitCourseComment } from "./api";

const commentFormSchema = z.object({
  rating: z.number().min(1, "请选择评分").max(5),
  content: z.string().trim().min(5, "评论至少 5 个字").max(500, "评论最多 500 个字"),
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
          className={`text-base leading-none ${onChange ? "cursor-pointer" : "cursor-default"}`}
          style={{ color: star <= value ? "#FF9C2A" : "#DDDDDD" }}
          aria-label={`${star} 星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      // 头像来自后端存储域名
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="size-12 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name.slice(0, 1)}
    </div>
  );
}

function CommentItem({ item, onPending }: { item: CourseComment; onPending: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="flex gap-4 border-t border-[#eee] pt-5">
      <Avatar name={commentAuthor(item)} src={item.user?.avatar} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ fontSize: 16, color: "#222" }}>{commentAuthor(item)}</span>
            <Stars value={item.rating} />
          </div>
          <div className="relative flex-shrink-0">
            <button
              type="button"
              aria-label="更多操作"
              className="px-1 leading-none transition-opacity hover:opacity-70"
              style={{ fontSize: 16, color: "#999" }}
              onClick={() => setMenuOpen((current) => !current)}
            >
              …
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-6 z-10 w-24 overflow-hidden rounded border border-[#ECECEC] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left transition-colors hover:bg-[#f6f8fc]"
                  style={{ fontSize: 14, color: "#555" }}
                  onClick={() => {
                    setMenuOpen(false);
                    onPending();
                  }}
                >
                  复制评论
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left transition-colors hover:bg-[#f6f8fc]"
                  style={{ fontSize: 14, color: "#555" }}
                  onClick={() => {
                    setMenuOpen(false);
                    onPending();
                  }}
                >
                  举报
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap" style={{ fontSize: 14, color: "#555", lineHeight: "22px" }}>
          {item.content}
        </p>
        <p className="mt-2" style={{ fontSize: 12, color: "#999" }}>
          {formatDateTime(item.created_at)}
        </p>
        <div className="mt-2 flex items-center gap-5">
          <button
            type="button"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontSize: 14, color: "#555" }}
            onClick={onPending}
          >
            <img src="/images/study/study-comments.png" alt="" width={16} height={16} className="flex-shrink-0" />
            <span>回复</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ fontSize: 14, color: "#555" }}
            onClick={onPending}
          >
            <img src="/images/study/study-like.png" alt="" width={16} height={16} className="flex-shrink-0" />
            <span>(0)</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function CourseComments({ courseId }: { courseId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CourseComment[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { rating: 5, content: "", is_anonymous: false },
  });
  const contentLength = (form.watch("content") ?? "").trim().length;

  async function load(nextPage = 1) {
    const result = await getCourseComments(courseId, nextPage);
    const comments = result.data.comments;
    setItems(comments.data);
    setPage(comments.current_page);
    setLastPage(comments.last_page ?? Math.max(1, Math.ceil(comments.total / comments.per_page)));
    setTotal(result.data.summary?.total ?? result.data.summary?.count ?? comments.total);
    const mine = comments.data.find((item) => item.user?.id === user?.id);
    if (mine) {
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
    void getCourseComments(courseId, 1)
      .then((result) => {
        if (cancelled) return;
        const comments = result.data.comments;
        setItems(comments.data);
        setPage(comments.current_page);
        setLastPage(comments.last_page ?? Math.max(1, Math.ceil(comments.total / comments.per_page)));
        setTotal(result.data.summary?.total ?? result.data.summary?.count ?? comments.total);
        const mine = comments.data.find((item) => item.user?.id === user?.id);
        if (mine) {
          form.reset({
            rating: mine.rating,
            content: mine.content,
            is_anonymous: Boolean(mine.is_anonymous),
          });
          setEditing(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "评论加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, form, user?.id]);

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

  function notifyPending() {
    toast({ title: "敬请期待", description: "该能力即将上线" });
  }

  return (
    <div>
      <h2 className="font-medium" style={{ fontSize: 16, color: "#222" }}>
        课程评价<span style={{ color: "#999" }}>({total})</span>
      </h2>

      <form className="mt-4 rounded-lg" style={{ backgroundColor: "#f6f8fc", padding: "20px 24px 24px" }} onSubmit={onSubmit}>
        <div className="flex flex-wrap items-center gap-3">
          <span style={{ fontSize: 14, color: "#555" }}>诚挚的邀请您对课程做出评价：</span>
          <Controller
            name="rating"
            control={form.control}
            render={({ field }) => (
              <Stars value={field.value} onChange={(value) => field.onChange(value)} />
            )}
          />
        </div>
        {form.formState.errors.rating?.message ? (
          <p className="mt-1" style={{ fontSize: 12, color: "#F16767" }}>{form.formState.errors.rating.message}</p>
        ) : null}
        <div className="mt-3">
          <Textarea
            id="content"
            maxLength={500}
            rows={5}
            placeholder="发表您对于本课程学习后的感受"
            {...form.register("content")}
          />
          <p className="mt-1 text-right" style={{ fontSize: 12, color: "#999" }}>
            {contentLength}/500
          </p>
          {form.formState.errors.content?.message ? (
            <p style={{ fontSize: 12, color: "#F16767" }}>{form.formState.errors.content.message}</p>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-end gap-4">
          <Controller
            name="is_anonymous"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2" style={{ fontSize: 14, color: "#555" }}>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                匿名展示
              </label>
            )}
          />
          <Button type="submit" loading={form.formState.isSubmitting} className="rounded px-6">
            {editing ? "更新评价" : "发表评价"}
          </Button>
        </div>
      </form>

      {error ? <Alert className="mt-4">{error}</Alert> : null}

      <p className="mt-6" style={{ fontSize: 14, color: "#555" }}>以下来自学员的评价</p>
      <div className="mt-3 flex flex-col gap-5">
        {loading ? <p style={{ fontSize: 14, color: "#999" }}>正在加载评论…</p> : null}
        {!loading && items.length === 0 ? <p style={{ fontSize: 14, color: "#999" }}>还没有评论，来写第一条吧。</p> : null}
        {items.map((item) => (
          <CommentItem key={item.id} item={item} onPending={notifyPending} />
        ))}
      </div>
      {lastPage > 1 ? (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={page}
            lastPage={lastPage}
            loading={loading}
            onPageChange={(next) => {
              setPage(next);
              setLoading(true);
              void load(next).finally(() => setLoading(false));
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
