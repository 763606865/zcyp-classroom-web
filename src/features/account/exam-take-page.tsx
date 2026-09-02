"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { HomeworkQuestion, MyExam } from "@/entities/classroom";
import { useAuth } from "@/features/auth/auth-provider";
import { examProgressLabel, formatDateTime } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getExamDetail, saveExamAnswer, startExam } from "./api";

function remainingLabel(endsAt: number | null, now: number) {
  if (endsAt == null) return "不限时";
  const diff = endsAt - now;
  if (diff <= 0) return "时间已到";
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

function examEndsAt(item: MyExam) {
  const ends: number[] = [];
  if (item.end_at) {
    const windowEnd = new Date(item.end_at).getTime();
    if (!Number.isNaN(windowEnd)) ends.push(windowEnd);
  }
  const minutes = item.duration_minutes;
  const started = item.attempt?.started_at;
  if (minutes != null && minutes > 0 && started) {
    const durationEnd = new Date(started).getTime() + minutes * 60_000;
    if (!Number.isNaN(durationEnd)) ends.push(durationEnd);
  }
  if (ends.length === 0) return null;
  return Math.min(...ends);
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

function sortedQuestions(item: MyExam) {
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

function canWriteExam(item: MyExam) {
  if (item.can_edit != null) return item.can_edit;
  return item.progress_status === "in_progress";
}

function applyItem(item: MyExam, setter: (value: MyExam) => void, setDrafts: (value: Record<number, string[]>) => void) {
  setter(item);
  const next: Record<number, string[]> = {};
  for (const question of item.questions ?? []) {
    if (question.user_answer?.length) next[question.id] = question.user_answer;
  }
  setDrafts(next);
}

function durationText(minutes?: number | null) {
  if (minutes == null || minutes <= 0) return "不限时";
  return `限时 ${minutes} 分钟`;
}

export function ExamTakeView({ examId }: { examId: number }) {
  const router = useRouter();
  const { status } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<MyExam>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState<"draft" | "submit">();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);
  const draftsRef = useRef(drafts);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=/account/exams/${examId}`);
  }, [router, status, examId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void getExamDetail(examId)
      .then((result) => {
        if (cancelled) return;
        applyItem(result.data, setItem, setDrafts);
      })
      .catch((err: unknown) => { if (!cancelled) setError(getApiErrorMessage(err, "考试加载失败")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, examId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const questions = useMemo(() => (item ? sortedQuestions(item) : []), [item]);
  const answeredCount = questions.filter((question) => isAnswered(question, drafts)).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const canWrite = item ? canWriteExam(item) : false;
  const endsAt = item ? examEndsAt(item) : null;
  const remaining = endsAt == null ? null : endsAt - now;
  const overdue = remaining != null && remaining <= 0;
  const meta = item
    ? [item.class?.name, item.course?.title, item.training?.title].filter(Boolean).join(" · ")
    : "";
  const revealAnswers = Boolean(item?.show_answer_after_submit)
    && ["submitted", "scored", "timeout"].includes(item?.progress_status ?? "");

  async function persist(submit: boolean) {
    setSaving(submit ? "submit" : "draft");
    try {
      const answers = questions
        .map((question) => ({ question_id: question.id, answer: answerOf(question, draftsRef.current) }))
        .filter((row) => row.answer.length > 0);
      const result = await saveExamAnswer(examId, { answers, submit });
      applyItem(result.data, setItem, setDrafts);
      setConfirmOpen(false);
      toast({ title: submit ? "已交卷" : "答案已保存" });
    } catch (err) {
      toast({ title: submit ? "交卷失败" : "保存失败", description: getApiErrorMessage(err) });
    } finally {
      setSaving(undefined);
    }
  }

  const handleExpire = useCallback(async () => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    try {
      const answers = questions
        .map((question) => ({ question_id: question.id, answer: answerOf(question, draftsRef.current) }))
        .filter((row) => row.answer.length > 0);
      if (answers.length > 0) {
        await saveExamAnswer(examId, { answers, submit: false });
      }
    } catch {
      // 超时以服务端结卷为准
    }
    try {
      const result = await getExamDetail(examId);
      applyItem(result.data, setItem, setDrafts);
      toast({ title: "考试时间已到", description: "系统已自动交卷。" });
    } catch (err) {
      toast({ title: "考试已结束", description: getApiErrorMessage(err) });
    }
  }, [examId, questions, toast]);

  useEffect(() => {
    if (!canWrite || !overdue) return;
    void handleExpire();
  }, [canWrite, overdue, handleExpire]);

  useEffect(() => {
    if (!canWrite) return;
    const timer = window.setInterval(() => {
      const answers = questions
        .map((question) => ({ question_id: question.id, answer: answerOf(question, draftsRef.current) }))
        .filter((row) => row.answer.length > 0);
      if (answers.length === 0) return;
      void saveExamAnswer(examId, { answers, submit: false }).catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [canWrite, examId, questions]);

  async function handleStart() {
    setStarting(true);
    try {
      const result = await startExam(examId);
      expiredRef.current = false;
      applyItem(result.data, setItem, setDrafts);
      setCurrentIndex(0);
    } catch (err) {
      toast({ title: "无法开始考试", description: getApiErrorMessage(err) });
    } finally {
      setStarting(false);
    }
  }

  if (status === "loading" || status === "anonymous" || loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载考试" /></div>;
  }
  if (error || !item) {
    return <EmptyState title="无法打开考试" description={error} action={<Link href="/account" className="text-sm text-primary">返回个人中心</Link>} />;
  }

  if (!canWrite) {
    const showReview = questions.length > 0 && item.progress_status !== "pending" && (reviewing || !item.can_start);
    return (
      <div className="grid gap-6">
        <p className="text-xs text-muted-foreground">
          <Link href="/account" className="hover:text-primary">个人中心</Link>
          <span> / 我的考试</span>
        </p>
        <div className="mx-auto w-full max-w-2xl rounded-card border border-border bg-surface p-6">
          <p className="text-sm text-muted-foreground">{examProgressLabel(item.progress_status)}</p>
          <h1 className="mt-1 text-xl font-semibold">{item.title}</h1>
          {meta ? <p className="mt-2 text-sm text-muted-foreground">{meta}</p> : null}
          {item.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{item.description}</p> : null}
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>{durationText(item.duration_minutes)}{item.duration_minutes ? "（开始后倒计时，到时自动交卷）" : ""}</li>
            {item.pass_score != null ? <li>及格分 {item.pass_score}{item.total_score != null ? ` / 满分 ${item.total_score}` : ""}</li> : null}
            {item.question_count ? <li>共 {item.question_count} 题</li> : null}
            <li>
              作答次数 {item.attempts_used ?? 0}
              {item.attempt_limit ? ` / ${item.attempt_limit}` : "（不限）"}
            </li>
            {item.start_at ? <li>开考 {formatDateTime(item.start_at)}</li> : null}
            {item.end_at ? <li>截止 {formatDateTime(item.end_at)}</li> : null}
            {item.attempt?.score != null ? (
              <li>
                最近得分 {item.attempt.score}
                {item.attempt.is_passed == null ? "" : item.attempt.is_passed ? " · 已通过" : " · 未通过"}
              </li>
            ) : null}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            {item.can_start ? (
              <Button loading={starting} onClick={() => void handleStart()}>
                {item.progress_status === "pending" ? "开始考试" : "再考一次"}
              </Button>
            ) : null}
            {questions.length > 0 && item.progress_status !== "pending" && item.can_start ? (
              <Button variant="secondary" onClick={() => setReviewing((value) => !value)}>
                {reviewing ? "收起试卷" : "查看上次作答"}
              </Button>
            ) : null}
            <Link href="/account"><Button variant="secondary">返回</Button></Link>
          </div>
        </div>
        {showReview ? (
          <ExamPaper
            item={item}
            questions={questions}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            drafts={drafts}
            setDrafts={setDrafts}
            canWrite={false}
            revealAnswers={revealAnswers}
            remainingText={remainingLabel(endsAt, now)}
            overdue={overdue}
            urgent={remaining != null && remaining <= 5 * 60_000}
            answeredCount={answeredCount}
            saving={saving}
            onSave={() => undefined}
            onSubmit={() => undefined}
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      <ExamPaper
        item={item}
        questions={questions}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        drafts={drafts}
        setDrafts={setDrafts}
        canWrite={canWrite}
        revealAnswers={revealAnswers}
        remainingText={remainingLabel(endsAt, now)}
        overdue={overdue}
        urgent={remaining != null && remaining <= 5 * 60_000}
        answeredCount={answeredCount}
        saving={saving}
        onSave={() => void persist(false)}
        onSubmit={() => setConfirmOpen(true)}
      />
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>确认交卷？</DialogTitle>
          <DialogDescription>
            已答 {answeredCount} / {questions.length} 题。交卷后本场不可再改
            {item.can_start ? "，若仍有剩余次数可再考一次。" : "。"}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>再检查一下</Button>
            <Button loading={saving === "submit"} disabled={!allAnswered} onClick={() => void persist(true)}>确认交卷</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExamPaper({
  item,
  questions,
  currentIndex,
  setCurrentIndex,
  drafts,
  setDrafts,
  canWrite,
  revealAnswers,
  remainingText,
  overdue,
  urgent,
  answeredCount,
  saving,
  onSave,
  onSubmit,
}: {
  item: MyExam;
  questions: HomeworkQuestion[];
  currentIndex: number;
  setCurrentIndex: (value: number | ((current: number) => number)) => void;
  drafts: Record<number, string[]>;
  setDrafts: Dispatch<SetStateAction<Record<number, string[]>>>;
  canWrite: boolean;
  revealAnswers: boolean;
  remainingText: string;
  overdue: boolean;
  urgent: boolean;
  answeredCount: number;
  saving?: "draft" | "submit";
  onSave: () => void;
  onSubmit: () => void;
}) {
  const current = questions[currentIndex];
  const meta = [item.class?.name, item.course?.title, item.training?.title].filter(Boolean).join(" · ");

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="grid h-fit gap-4">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">答题卡</p>
          <p className="mt-1 text-sm font-medium">共 {questions.length} 题 · 已答 {answeredCount}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {questions.map((question, index) => {
              const done = isAnswered(question, drafts);
              const active = index === currentIndex;
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`size-9 rounded-md border text-sm font-medium ${active ? "ring-2 ring-primary/30" : ""} ${
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">限时考试到点会自动交卷，请留意倒计时。</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-sm">
          <p className="font-medium">{examProgressLabel(item.progress_status)}</p>
          {item.attempt?.score != null ? (
            <p className="mt-2">
              得分 {item.attempt.score}{item.total_score != null ? ` / ${item.total_score}` : ""}
              {item.attempt.is_passed == null ? "" : item.attempt.is_passed ? " · 已通过" : " · 未通过"}
            </p>
          ) : item.pass_score != null ? (
            <p className="mt-2 text-muted-foreground">及格分 {item.pass_score}</p>
          ) : null}
          {item.attempt?.attempt_no ? <p className="mt-2 text-muted-foreground">第 {item.attempt.attempt_no} 次作答</p> : null}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col rounded-card border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground">
              <Link href="/account" className="hover:text-primary">个人中心</Link>
              <span> / 我的考试</span>
            </p>
            <h1 className="mt-1 text-lg font-semibold">{item.title}</h1>
            {meta ? <p className="mt-1 text-sm text-muted-foreground">{meta}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-sm font-medium ${overdue || urgent ? "text-danger" : ""}`}>
              {remainingText}
            </p>
            {canWrite ? (
              <>
                <Button variant="secondary" loading={saving === "draft"} disabled={Boolean(saving) || overdue} onClick={onSave}>
                  保存答案
                </Button>
                <Button loading={saving === "submit"} disabled={Boolean(saving) || overdue} onClick={onSubmit}>
                  交卷
                </Button>
              </>
            ) : (
              <Link href="/account"><Button variant="secondary">返回</Button></Link>
            )}
          </div>
        </header>

        <div className="grid flex-1 gap-6 p-5">
          {current ? (
            <QuestionBlock
              index={currentIndex}
              question={current}
              locked={!canWrite}
              reviewed={revealAnswers}
              draft={answerOf(current, drafts)}
              onDraft={(value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [current.id]: value }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">暂无题目</p>
          )}
          {questions.length > 1 ? (
            <div className="flex justify-between">
              <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => value - 1)}>上一题</Button>
              <Button variant="secondary" disabled={currentIndex >= questions.length - 1} onClick={() => setCurrentIndex((value) => value + 1)}>下一题</Button>
            </div>
          ) : null}
        </div>
      </section>
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
          {question.correct_answer?.length ? `正确答案 ${question.correct_answer.join("、")}` : ""}
          {question.analysis ? ` · 解析：${question.analysis}` : ""}
          {question.earned_score != null ? ` · 本题 ${question.earned_score} 分` : ""}
        </p>
      ) : null}
    </div>
  );
}
