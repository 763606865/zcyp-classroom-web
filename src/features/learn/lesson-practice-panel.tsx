"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { PracticeAttempt, PracticeQuestion } from "@/entities/learn";
import { getApiErrorMessage } from "@/lib/forms";
import {
  getLessonPractices,
  getPracticeAttempt,
  startLessonPractice,
  submitPracticeQuestionAnswer,
} from "./api";

type PickedQuestion = {
  attemptId: number;
  questionId: number;
};

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

function judgeOptions(question: PracticeQuestion) {
  if (question.options?.length) return question.options;
  return [
    { key: "true", text: "正确" },
    { key: "false", text: "错误" },
  ];
}

function sortedQuestions(attempt: PracticeAttempt) {
  return [...(attempt.questions ?? [])].sort((a, b) => (a.sort ?? a.id) - (b.sort ?? b.id));
}

function isAnswered(question: PracticeQuestion) {
  return question.user_answer != null && question.user_answer.length > 0;
}

function QuestionStats({ question }: { question: PracticeQuestion }) {
  const stats = question.stats;
  if (!stats) return null;
  const options = stats.options ?? [];
  return (
    <div className="mt-4 rounded-md bg-muted/60 p-3 text-sm">
      <p className="text-muted-foreground">
        本班已答 {stats.answered_count} 人 · 答对 {stats.correct_count} · 答错 {stats.wrong_count}
        {stats.pending_count ? ` · 待判 ${stats.pending_count}` : ""}
      </p>
      {options.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {options.map((option) => {
            const percent = option.ratio == null ? 0 : Math.round(option.ratio * 100);
            const label = question.options?.find((item) => item.key === option.key)?.text
              ?? judgeOptions(question).find((item) => item.key === option.key)?.text
              ?? option.key;
            const picked = question.user_answer?.includes(option.key);
            return (
              <div key={option.key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className={picked ? "font-medium text-primary" : ""}>{option.key}. {label}</span>
                  <span className="text-muted-foreground">{option.count} 人 · {percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div className={`h-full rounded-full ${picked ? "bg-primary" : "bg-muted-foreground/40"}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function QuestionForm({
  question,
  locked,
  submitting,
  draft,
  onDraft,
  onSubmit,
}: {
  question: PracticeQuestion;
  locked: boolean;
  submitting: boolean;
  draft: string[];
  onDraft: (value: string[]) => void;
  onSubmit: () => void;
}) {
  const answered = isAnswered(question);
  const showResult = answered;
  const options = question.type === "judge" ? judgeOptions(question) : (question.options ?? []);
  const choiceType = question.type === "single" || question.type === "judge" || question.type === "multiple";

  return (
    <div>
      {choiceType ? (
        <div className="mt-4 grid gap-2" role={question.type === "multiple" ? "group" : "radiogroup"} aria-label="选项">
          {options.map((option) => {
            const selected = (answered ? question.user_answer : draft)?.includes(option.key);
            const correct = showResult && question.correct_answer?.includes(option.key);
            const canPick = !answered && !locked;
            return (
              <button
                key={option.key}
                type="button"
                disabled={!canPick}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!canPick) return;
                  if (question.type === "multiple") {
                    if (draft.includes(option.key)) onDraft(draft.filter((item) => item !== option.key));
                    else onDraft([...draft, option.key]);
                    return;
                  }
                  onDraft([option.key]);
                }}
                className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm ${
                  showResult
                    ? correct
                      ? "border-primary bg-primary/5"
                      : selected
                        ? "border-danger/40 bg-danger/5"
                        : "border-border"
                    : selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                } ${canPick ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center border ${
                    question.type === "multiple" ? "rounded" : "rounded-full"
                  } ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}
                >
                  {selected ? <span className={question.type === "multiple" ? "block size-2 bg-primary-foreground" : "block size-1.5 rounded-full bg-primary-foreground"} /> : null}
                </span>
                <span><span className="mr-1 font-medium">{option.key}.</span>{option.text}</span>
              </button>
            );
          })}
        </div>
      ) : question.type === "fill" ? (
        <Input
          className="mt-4"
          value={answered ? (question.user_answer?.[0] ?? "") : (draft[0] ?? "")}
          disabled={answered || locked}
          onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
          placeholder="请输入答案"
        />
      ) : (
        <Textarea
          className="mt-4"
          value={answered ? (question.user_answer?.[0] ?? "") : (draft[0] ?? "")}
          disabled={answered || locked}
          onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
          placeholder="请输入作答"
        />
      )}

      {showResult ? (
        <>
          <p className={`mt-4 text-sm ${question.is_correct ? "text-primary" : question.is_correct === false ? "text-danger" : "text-muted-foreground"}`}>
            {question.is_correct == null ? "已提交，待判分" : question.is_correct ? "回答正确" : "回答错误"}
            {question.earned_score != null ? ` · 得分 ${question.earned_score}` : ""}
            {question.correct_answer?.length ? ` · 正确答案 ${question.correct_answer.join("、")}` : ""}
          </p>
          {question.analysis ? <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">解析：{question.analysis}</p> : null}
          <QuestionStats question={question} />
        </>
      ) : (
        <div className="mt-4">
          <Button disabled={locked || submitting || draft.length === 0} loading={submitting} onClick={onSubmit}>
            提交本题
          </Button>
        </div>
      )}
    </div>
  );
}

export function LessonPracticePanel({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number>();
  const [picked, setPicked] = useState<PickedQuestion | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getLessonPractices(courseId, lessonId);
        if (cancelled) return;
        const opened: PracticeAttempt[] = [];
        for (const item of list.data) {
          const result = item.my_attempt?.status === "completed"
            ? await getPracticeAttempt(item.my_attempt.id)
            : await startLessonPractice(courseId, lessonId, item.id);
          if (cancelled) return;
          opened.push(result.data);
        }
        setAttempts(opened);
        setError(undefined);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "练习加载失败"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const banners = useMemo(() => {
    const items: Array<{ attempt: PracticeAttempt; question: PracticeQuestion; index: number }> = [];
    for (const attempt of attempts) {
      sortedQuestions(attempt).forEach((question, index) => {
        items.push({ attempt, question, index });
      });
    }
    return items;
  }, [attempts]);

  const active = banners.find((item) => item.attempt.id === picked?.attemptId && item.question.id === picked?.questionId);

  async function submitQuestion(attempt: PracticeAttempt, question: PracticeQuestion) {
    const answer = drafts[question.id] ?? [];
    if (answer.length === 0) return;
    setSubmittingId(question.id);
    try {
      const result = await submitPracticeQuestionAnswer(attempt.id, question.id, answer);
      setAttempts((current) => current.map((item) => item.id === result.data.id ? result.data : item));
      setDrafts((current) => {
        const next = { ...current };
        delete next[question.id];
        return next;
      });
    } catch (err) {
      toast({ title: "提交失败", description: getApiErrorMessage(err) });
    } finally {
      setSubmittingId(undefined);
    }
  }

  if (loading) {
    return (
      <Card className="mt-4 p-4">
        <h2 className="font-semibold">课上练习</h2>
        <div className="mt-4"><Spinner label="加载练习" /></div>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="mt-4 p-4">
        <h2 className="font-semibold">课上练习</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }
  if (banners.length === 0) return null;

  return (
    <Card className="mt-4 overflow-hidden p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">课上练习</h2>
          <p className="mt-1 text-sm text-muted-foreground">左右滑动选题，点开后作答；提交后才显示解析和本班统计。</p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">共 {banners.length} 题</p>
      </div>
      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:thin]">
        <div className="flex snap-x snap-mandatory gap-3">
          {banners.map(({ attempt, question, index }) => {
            const done = isAnswered(question);
            return (
              <button
                key={`${attempt.id}-${question.id}`}
                type="button"
                onClick={() => setPicked({ attemptId: attempt.id, questionId: question.id })}
                className={`w-64 shrink-0 snap-start rounded-xl border p-4 text-left transition ${
                  done
                    ? "border-primary/30 bg-primary/5 hover:border-primary"
                    : "border-border bg-gradient-to-br from-muted/80 to-surface hover:border-primary"
                }`}
              >
                <p className="text-xs text-muted-foreground">
                  第 {index + 1} 题 · {questionTypeLabel(question.type)}
                  {done ? " · 已答" : ""}
                </p>
                <p className="mt-2 line-clamp-4 text-sm font-medium leading-6">{question.stem}</p>
              </button>
            );
          })}
        </div>
      </div>

      {picked && active
        ? createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="关闭练习"
            className="absolute inset-0 bg-black/50"
            onClick={() => setPicked(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="practice-question-title"
            className="relative z-[201] max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-card border border-border bg-surface p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="关闭"
              className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setPicked(null)}
            >
              <X className="size-4" />
            </button>
            <h3 id="practice-question-title" className="pr-8 text-lg font-semibold">
              第 {active.index + 1} 题 · {questionTypeLabel(active.question.type)}
              {active.question.score != null ? ` · ${active.question.score} 分` : ""}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">{active.question.stem}</p>
            <QuestionForm
              question={active.question}
              locked={isAnswered(active.question)}
              submitting={submittingId === active.question.id}
              draft={drafts[active.question.id] ?? []}
              onDraft={(value) => setDrafts((current) => ({ ...current, [active.question.id]: value }))}
              onSubmit={() => void submitQuestion(active.attempt, active.question)}
            />
          </div>
        </div>,
        document.body,
      )
      : null}
    </Card>
  );
}
