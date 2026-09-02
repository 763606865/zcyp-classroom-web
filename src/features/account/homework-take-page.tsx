"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { HomeworkQuestion, MyHomework } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDateTime, homeworkProgressLabel } from "@/features/classroom/labels";
import { uploadFile } from "@/features/files/api";
import { getApiErrorMessage } from "@/lib/forms";
import { getHomeworkDetail, saveHomeworkAnswer, startHomework } from "./api";

const MAX_ATTACHMENTS = 20;

function fileNameFromUrl(url: string) {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split("/").pop() ?? "");
    return name || url;
  } catch {
    return url;
  }
}

function remainingLabel(deadlineAt: string | null | undefined, now: number) {
  if (!deadlineAt) return "不限时";
  const end = new Date(deadlineAt).getTime();
  if (Number.isNaN(end)) return "不限时";
  const diff = end - now;
  if (diff <= 0) return "已截止";
  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diff % 60_000) / 1000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `剩余 ${days} 天 ${hours % 24} 小时`;
  }
  return `剩余 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function questionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    single: "单选",
    multiple: "多选",
    judge: "判断",
    fill: "填空",
    essay: "简答",
  };
  return labels[type] ?? type;
}

function judgeOptions(question: HomeworkQuestion) {
  if (question.options?.length) return question.options;
  return [
    { key: "true", text: "正确" },
    { key: "false", text: "错误" },
  ];
}

function sortedQuestions(item: MyHomework) {
  return [...(item.questions ?? [])].sort((a, b) => (a.sort ?? a.id) - (b.sort ?? b.id));
}

function answerOf(question: HomeworkQuestion, drafts: Record<number, string[]>) {
  return drafts[question.id] ?? question.user_answer ?? [];
}

function isAnswered(question: HomeworkQuestion, drafts: Record<number, string[]>) {
  return answerOf(question, drafts).length > 0;
}

function isChoiceType(type: string) {
  return type === "single" || type === "multiple" || type === "judge"
    || type === "single_choice" || type === "multi" || type === "checkbox" || type === "radio";
}

function optionLabel(option: { key: string; text?: string; content?: string }) {
  return option.text || option.content || option.key;
}

function canWriteHomework(item: MyHomework) {
  if (item.can_edit != null) return item.can_edit;
  if (item.submission?.can_edit != null) return item.submission.can_edit;
  return item.progress_status === "draft" || item.progress_status === "returned";
}

function applyItem(item: MyHomework, setter: (value: MyHomework) => void, setAttachments: (value: string[]) => void, setDrafts: (value: Record<number, string[]>) => void) {
  setter(item);
  setAttachments(item.submission?.attachment_urls ?? []);
  const next: Record<number, string[]> = {};
  for (const question of item.questions ?? []) {
    if (question.user_answer?.length) next[question.id] = question.user_answer;
  }
  setDrafts(next);
}

export function HomeworkTakeView({ homeworkId }: { homeworkId: number }) {
  const router = useRouter();
  const { status } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<MyHomework>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState<"draft" | "submit">();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=/account/homeworks/${homeworkId}`);
  }, [router, status, homeworkId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await getHomeworkDetail(homeworkId);
        if (cancelled) return;
        let detail = result.data;
        if (detail.can_start) {
          try {
            const started = await startHomework(homeworkId);
            if (cancelled) return;
            detail = started.data;
          } catch (err) {
            if (cancelled) return;
            setError(undefined);
            applyItem(detail, setItem, setAttachments, setDrafts);
            toast({ title: "暂不能开始作答", description: getApiErrorMessage(err) });
            return;
          }
        }
        applyItem(detail, setItem, setAttachments, setDrafts);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "作业加载失败"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status, homeworkId, toast]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const questions = useMemo(() => (item ? sortedQuestions(item) : []), [item]);
  const current = questions[currentIndex];
  const answeredCount = questions.filter((question) => isAnswered(question, drafts)).length;
  const allAnswered = questions.length === 0
    ? attachments.length > 0
    : answeredCount === questions.length;
  const canWrite = item ? canWriteHomework(item) : false;
  const overdue = Boolean(item?.deadline_at && new Date(item.deadline_at).getTime() < now);
  const meta = item
    ? [item.class?.name, item.course?.title, item.lesson?.title].filter(Boolean).join(" · ")
    : "";

  async function persist(submit: boolean) {
    setSaving(submit ? "submit" : "draft");
    try {
      const answers = questions
        .map((question) => ({ question_id: question.id, answer: answerOf(question, drafts) }))
        .filter((row) => row.answer.length > 0);
      const result = await saveHomeworkAnswer(homeworkId, {
        attachment_urls: attachments,
        answers,
        submit,
      });
      applyItem(result.data, setItem, setAttachments, setDrafts);
      setConfirmOpen(false);
      toast({ title: submit ? "已交卷" : "草稿已保存" });
    } catch (err) {
      toast({ title: submit ? "交卷失败" : "保存失败", description: getApiErrorMessage(err) });
    } finally {
      setSaving(undefined);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !canWrite) return;
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast({ title: "附件已满", description: `最多上传 ${MAX_ATTACHMENTS} 个附件` });
      return;
    }
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const result = await uploadFile(file, "document");
        next.push(result.data.file.url);
      }
      setAttachments((current) => [...current, ...next]);
    } catch (err) {
      toast({ title: "上传失败", description: getApiErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  if (status === "loading" || status === "anonymous" || loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载作业" /></div>;
  }
  if (error || !item) {
    return <EmptyState title="无法打开作业" description={error} action={<Link href="/account" className="text-sm text-primary">返回个人中心</Link>} />;
  }

  const progress = item.progress_status;
  const reviewed = progress === "reviewed";

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="grid h-fit gap-4">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">答题卡</p>
          <p className="mt-1 text-sm font-medium">
            {questions.length > 0 ? `共 ${questions.length} 题 · 已答 ${answeredCount}` : "开放作答"}
          </p>
          {questions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {questions.map((question, index) => {
                const done = isAnswered(question, drafts);
                const active = index === currentIndex;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`size-9 rounded-md border text-sm font-medium ${
                      active
                        ? "border-primary ring-2 ring-primary/30"
                        : ""
                    } ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          ) : null}
          <p className="mt-4 text-xs text-muted-foreground">绿色为已作答。交卷后不可再改，除非老师退回。</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-sm">
          <p className="font-medium">{homeworkProgressLabel(progress)}</p>
          {item.submission?.score != null ? (
            <p className="mt-2">得分 {item.submission.score}{item.total_score != null ? ` / ${item.total_score}` : ""}</p>
          ) : item.total_score != null ? (
            <p className="mt-2 text-muted-foreground">满分 {item.total_score}</p>
          ) : null}
          {item.reviewer?.name ? <p className="mt-2 text-muted-foreground">批改人 {item.reviewer.name}</p> : null}
          {item.submission?.feedback ? <p className="mt-3 whitespace-pre-wrap text-muted-foreground">评语：{item.submission.feedback}</p> : null}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col rounded-card border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">
              <Link href="/account" className="hover:text-primary">个人中心</Link>
              <span> / 我的作业</span>
            </p>
            <h1 className="mt-1 text-lg font-semibold">{item.title}</h1>
            {meta ? <p className="mt-1 text-sm text-muted-foreground">{meta}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-sm font-medium ${overdue ? "text-danger" : ""}`}>
              {remainingLabel(item.deadline_at, now)}
            </p>
            {canWrite ? (
              <>
                <Button variant="secondary" loading={saving === "draft"} disabled={Boolean(saving)} onClick={() => void persist(false)}>
                  保存草稿
                </Button>
                <Button loading={saving === "submit"} disabled={Boolean(saving) || !allAnswered} onClick={() => setConfirmOpen(true)}>
                  交卷
                </Button>
              </>
            ) : (
              <Link href="/account"><Button variant="secondary">返回</Button></Link>
            )}
          </div>
        </header>

        <div className="grid flex-1 gap-6 p-5">
          {item.description ? (
            <div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item.description}</div>
          ) : null}
          {(item.attachment_urls?.length ?? 0) > 0 ? (
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <p className="font-medium">试题材料</p>
              <ul className="mt-2 grid gap-1">
                {item.attachment_urls?.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{fileNameFromUrl(url)}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {current ? (
            <QuestionBlock
              index={currentIndex}
              question={current}
              locked={!canWrite}
              reviewed={reviewed}
              draft={answerOf(current, drafts)}
              onDraft={(value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [current.id]: value }))}
            />
          ) : null}

          {questions.length > 1 ? (
            <div className="flex justify-between">
              <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => value - 1)}>上一题</Button>
              <Button variant="secondary" disabled={currentIndex >= questions.length - 1} onClick={() => setCurrentIndex((value) => value + 1)}>下一题</Button>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium">附件（最多 {MAX_ATTACHMENTS} 个）</p>
            {attachments.length > 0 ? (
              <ul className="mt-2 grid gap-2">
                {attachments.map((url) => (
                  <li key={url} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                    <a href={url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">{fileNameFromUrl(url)}</a>
                    {canWrite ? (
                      <button type="button" className="shrink-0 text-danger" onClick={() => setAttachments((current) => current.filter((item) => item !== url))}>
                        移除
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">暂无附件</p>
            )}
            {canWrite ? (
              <label className="mt-3 inline-flex">
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    void handleUpload(event.target.files);
                    event.target.value = "";
                  }}
                />
                <span className="inline-flex min-h-10 cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                  {uploading ? "上传中…" : "上传附件"}
                </span>
              </label>
            ) : null}
          </div>

          {item.deadline_at ? (
            <p className="text-xs text-muted-foreground">
              截止 {formatDateTime(item.deadline_at)}
              {item.allow_late ? " · 允许补交" : ""}
              {item.submission?.submitted_at ? ` · 交卷于 ${formatDateTime(item.submission.submitted_at)}` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>确认交卷？</DialogTitle>
          <DialogDescription>
            {questions.length > 0
              ? `已答 ${answeredCount} / ${questions.length} 题。交卷后将无法再修改，等待老师批改。`
              : "交卷后将无法再修改，等待老师批改。请确认附件已填写完整。"}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>再检查一下</Button>
            <Button loading={saving === "submit"} onClick={() => void persist(true)}>确认交卷</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionBlock({
  index,
  question,
  locked,
  reviewed,
  draft,
  onDraft,
}: {
  index: number;
  question: HomeworkQuestion;
  locked: boolean;
  reviewed: boolean;
  draft: string[];
  onDraft: (value: string[]) => void;
}) {
  const options = question.type === "judge" ? judgeOptions(question) : (question.options ?? []);
  const choiceType = isChoiceType(question.type);
  const multiple = question.type === "multiple" || question.type === "multi" || question.type === "checkbox";
  const selected = draft.map(String);
  const showKey = reviewed && Boolean(question.correct_answer?.length || question.analysis);

  function pick(key: string) {
    if (locked) return;
    if (multiple) {
      onDraft(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key]);
      return;
    }
    onDraft([key]);
  }

  return (
    <div>
      <p className="text-sm font-medium">
        第 {index + 1} 题 · {questionTypeLabel(question.type)}
        {question.score != null ? ` · ${question.score} 分` : ""}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{question.stem}</p>
      {choiceType ? (
        <div className="mt-4 grid gap-2" role={multiple ? "group" : "radiogroup"} aria-label="选项">
          {options.map((option) => {
            const key = String(option.key);
            const picked = selected.includes(key);
            const correct = showKey && question.correct_answer?.map(String).includes(key);
            return (
              <button
                key={key}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  pick(key);
                }}
                className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm ${
                  showKey
                    ? correct
                      ? "border-primary bg-primary/5"
                      : picked
                        ? "border-danger/40 bg-danger/5"
                        : "border-border"
                    : picked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                } ${locked ? "cursor-default" : "cursor-pointer"}`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center border ${
                    multiple ? "rounded" : "rounded-full"
                  } ${picked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}
                >
                  {picked ? <span className={multiple ? "block size-2 bg-primary-foreground" : "block size-1.5 rounded-full bg-primary-foreground"} /> : null}
                </span>
                <span><span className="mr-1 font-medium">{key}.</span>{optionLabel(option)}</span>
              </button>
            );
          })}
        </div>
      ) : question.type === "fill" ? (
        <Input
          className="mt-4"
          value={selected[0] ?? ""}
          disabled={locked}
          onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
          placeholder="请输入答案"
        />
      ) : (
        <Textarea
          className="mt-4"
          value={selected[0] ?? ""}
          disabled={locked}
          onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
          placeholder="请输入作答"
        />
      )}
      {showKey ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {question.correct_answer?.length ? `正确答案 ${question.correct_answer.join("、")}` : "已批改"}
          {question.analysis ? ` · 解析：${question.analysis}` : ""}
        </p>
      ) : null}
    </div>
  );
}
