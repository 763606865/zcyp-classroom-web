"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { HomeworkQuestion, MyHomework } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { homeworkProgressLabel } from "@/features/classroom/labels";
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

const questionTypeLabels: Record<string, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  fill: "填空题",
  essay: "简答题",
};

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

// 章节 / 课时仅取自详情 lesson 关联摘要自带字段（可能不返回，缺省隐藏）
function lessonChapterTitle(lesson: MyHomework["lesson"]): string | undefined {
  const chapter = lesson?.chapter as { title?: string } | undefined;
  return typeof chapter?.title === "string" && chapter.title ? chapter.title : undefined;
}

function lessonPeriod(lesson: MyHomework["lesson"]): number | undefined {
  const sort = lesson?.sort;
  return typeof sort === "number" ? sort : undefined;
}

type QuestionEntry = { question: HomeworkQuestion; index: number };
type QuestionGroup = { type: string; label: string; summary: string; entries: QuestionEntry[] };

function groupSummary(entries: QuestionEntry[]) {
  const scores = entries.map((entry) => entry.question.score).filter((score): score is number => score != null);
  let scoreText = "";
  if (entries.length > 0 && scores.length === entries.length) {
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    scoreText = min === max ? `，每题${min}分` : `，每题${min}~${max}分`;
  }
  return `共${entries.length}小题${scoreText}`;
}

function groupQuestions(questions: HomeworkQuestion[]): QuestionGroup[] {
  const byType = new Map<string, QuestionEntry[]>();
  questions.forEach((question, index) => {
    const entry: QuestionEntry = { question, index };
    const list = byType.get(question.type);
    if (list) list.push(entry);
    else byType.set(question.type, [entry]);
  });
  return [...byType.entries()].map(([type, entries]) => ({
    type,
    label: questionTypeLabels[type] ?? type,
    summary: groupSummary(entries),
    entries,
  }));
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
  const [saving, setSaving] = useState<"draft" | "submit">();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const questions = useMemo(() => (item ? sortedQuestions(item) : []), [item]);
  const groups = useMemo(() => groupQuestions(questions), [questions]);
  const answeredCount = questions.filter((question) => isAnswered(question, drafts)).length;
  const allAnswered = questions.length === 0
    ? attachments.length > 0
    : answeredCount === questions.length;
  const canWrite = item ? canWriteHomework(item) : false;
  const chapterTitle = item ? lessonChapterTitle(item.lesson) : undefined;
  const lessonTitle = item?.lesson?.title ?? item?.lesson?.name;
  const lessonLine = [chapterTitle, lessonTitle].filter(Boolean).join("：");
  const period = item ? lessonPeriod(item.lesson) : undefined;

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
    return <EmptyState title="无法打开作业" description={error} action={<Link href="/account?tab=homeworks" className="text-sm text-primary">返回我的作业</Link>} />;
  }

  const reviewed = item.progress_status === "reviewed";
  const teacherAttachments = item.attachment_urls ?? [];

  return (
    <div>
      {/* 卡片头 */}
      <div className="flex items-center justify-between border-b border-[#ECECEC] px-[32px] py-[14px] sm:px-[28px]">
        <span className="text-[16px] font-semibold" style={{ color: "#222" }}>作业详情</span>
        <button
          type="button"
          onClick={() => router.push("/account?tab=homeworks")}
          className="flex h-8 items-center gap-[6px] rounded-md border bg-white px-[13px] text-sm transition hover:bg-gray-50"
          style={{ borderColor: "#ECECEC", color: "#222" }}
        >
          <img src="/images/personal/homework-back.png" alt="" className="h-4 w-4" width={16} height={16} />
          返回
        </button>
      </div>

      <div className="px-[32px] py-[20px] sm:px-[28px]">
        {/* 作业标题 */}
        <h1 className="font-medium leading-6" style={{ fontSize: 18, color: "#0F62FE" }}>{item.title}</h1>

        {/* 作业要求 */}
        {item.description ? (
          <p className="mt-[12px] whitespace-pre-wrap text-sm leading-6" style={{ color: "rgba(34, 34, 34, 0.6)" }}>
            作业要求：{item.description}
          </p>
        ) : null}

        {/* 内容区 */}
        <div className="mt-[24px] flex flex-col gap-6 lg:flex-row">
          {/* 左栏：作业信息 */}
          <aside className="flex w-full flex-col lg:w-[250px] lg:shrink-0">
            <div className="grid gap-[14px] text-sm leading-5" style={{ color: "#222" }}>
              {item.class?.name ? <p>{item.class.name}</p> : null}
              {lessonLine ? <p>{lessonLine}</p> : null}
              {period != null ? <p>第{period}课时</p> : null}
              <div className="flex gap-1">
                <span className="shrink-0">附件：</span>
                <span className="grid gap-1">
                  {teacherAttachments.length > 0 ? teacherAttachments.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-1 hover:underline"
                      style={{ color: "#0F62FE" }}
                    >
                      {fileNameFromUrl(url)}
                      <img src="/images/personal/homework-download.png" alt="下载" className="h-4 w-4" width={16} height={16} />
                    </a>
                  )) : <span>无</span>}
                </span>
              </div>
              <p>当前状态：{homeworkProgressLabel(item.progress_status)}</p>
              <p>作业得分：{item.submission?.score != null ? item.submission.score : "–"}</p>
            </div>

            {/* 学员附件 */}
            {attachments.length > 0 || canWrite ? (
              <div className="mt-[14px] grid gap-2 text-sm leading-5" style={{ color: "#222" }}>
                <p>我的附件（最多 {MAX_ATTACHMENTS} 个）：</p>
                {attachments.length > 0 ? (
                  <ul className="grid gap-2">
                    {attachments.map((url) => (
                      <li key={url} className="flex items-center justify-between gap-2">
                        <a href={url} target="_blank" rel="noreferrer" download className="min-w-0 truncate hover:underline" style={{ color: "#0F62FE" }}>
                          {fileNameFromUrl(url)}
                        </a>
                        {canWrite ? (
                          <button
                            type="button"
                            className="shrink-0 text-xs"
                            style={{ color: "#F16767" }}
                            onClick={() => setAttachments((current) => current.filter((item) => item !== url))}
                          >
                            移除
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {canWrite ? (
                  <label className="inline-flex">
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
                    <span
                      className="inline-flex h-8 cursor-pointer items-center rounded-md border px-[13px] text-sm transition hover:bg-gray-50"
                      style={{ borderColor: "#0F62FE", color: "#0F62FE" }}
                    >
                      {uploading ? "上传中…" : "上传附件"}
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}

            {/* 操作按钮 */}
            {canWrite ? (
              <div className="mt-[24px] flex max-w-[240px] gap-3">
                <Button
                  className="h-8 min-h-0 flex-1 px-[13px] py-[6px]"
                  loading={saving === "submit"}
                  disabled={Boolean(saving) || !allAnswered}
                  onClick={() => setConfirmOpen(true)}
                >
                  提交作业
                </Button>
                <Button
                  variant="secondary"
                  className="h-8 min-h-0 flex-1 px-[13px] py-[6px]"
                  style={{ borderColor: "#0F62FE", color: "#0F62FE" }}
                  loading={saving === "draft"}
                  disabled={Boolean(saving)}
                  onClick={() => void persist(false)}
                >
                  存为草稿
                </Button>
              </div>
            ) : null}
          </aside>

          {/* 右栏：作业内容 */}
          <section className="min-w-0 flex-1">
            <div className="max-h-[530px] overflow-y-auto rounded-lg p-[16px]" style={{ background: "#F6F8FC" }}>
              <div className="overflow-hidden rounded-lg bg-white">
                <p className="px-4 pt-4 text-sm font-semibold" style={{ color: "#222" }}>{item.title}</p>
                {groups.map((group) => (
                  <div key={group.type} className="mt-3">
                    <div className="flex items-center gap-2 px-4 py-[10px]" style={{ background: "#F6F8FC" }}>
                      <span className="text-sm font-medium" style={{ color: "#0F62FE" }}>{group.label}</span>
                      <span className="text-xs" style={{ color: "#999" }}>{group.summary}</span>
                    </div>
                    <div>
                      {group.entries.map((entry) => (
                        <QuestionBlock
                          key={entry.question.id}
                          index={entry.index}
                          question={entry.question}
                          locked={!canWrite}
                          reviewed={reviewed}
                          draft={answerOf(entry.question, drafts)}
                          onDraft={(value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [entry.question.id]: value }))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {questions.length === 0 ? (
              <p className="mt-3 text-xs" style={{ color: "#999" }}>
                本次作业无固定题目，请通过附件提交作业内容。
              </p>
            ) : null}
          </section>
        </div>
      </div>

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
    <div className="flex gap-3 border-t px-4 py-4" style={{ borderColor: "#F0F0F0" }}>
      <span
        aria-hidden
        className="mt-[2px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded text-sm font-semibold text-white"
        style={{ background: "#0F62FE" }}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6" style={{ color: "#222" }}>
          {question.stem}
          {question.score != null ? <span className="ml-1 text-xs" style={{ color: "#999" }}>（{question.score}分）</span> : null}
        </p>
        {choiceType ? (
          <div className="mt-2 grid gap-1" role={multiple ? "group" : "radiogroup"} aria-label="选项">
            {options.map((option) => {
              const key = String(option.key);
              const picked = selected.includes(key);
              const correct = showKey && question.correct_answer?.map(String).includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-start gap-2 text-xs leading-5 ${locked ? "" : "cursor-pointer"}`}
                  style={{ color: correct ? "#0F62FE" : "#555" }}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    className="mt-[3px] size-[14px] shrink-0 accent-[#0F62FE]"
                    checked={picked}
                    disabled={locked}
                    onChange={() => pick(key)}
                  />
                  <span>{key}、{optionLabel(option)}</span>
                </label>
              );
            })}
          </div>
        ) : question.type === "fill" ? (
          <div className="mt-3 grid" style={{ gridTemplateColumns: "minmax(0, 70%)" }}>
            <Input
              value={selected[0] ?? ""}
              disabled={locked}
              onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
              placeholder="请输入答案"
            />
          </div>
        ) : (
          <div className="mt-3 grid" style={{ gridTemplateColumns: "minmax(0, 70%)" }}>
            <Textarea
              value={selected[0] ?? ""}
              disabled={locked}
              onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
              placeholder="请输入作答"
            />
          </div>
        )}
        {showKey ? (
          <p className="mt-3 text-xs" style={{ color: "#999" }}>
            {question.correct_answer?.length ? `正确答案 ${question.correct_answer.join("、")}` : "已批改"}
            {question.analysis ? ` · 解析：${question.analysis}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
