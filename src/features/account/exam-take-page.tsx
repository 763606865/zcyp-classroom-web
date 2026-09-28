"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { examProgressLabel } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getExamDetail, saveExamAnswer, startExam } from "./api";

const questionTypeLabels: Record<string, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  fill: "填空题",
  essay: "简答题",
};

function countdownText(diff: number | null) {
  if (diff == null) return "不限时";
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
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

function startAtOf(item: MyExam) {
  if (!item.start_at) return null;
  const value = new Date(item.start_at).getTime();
  return Number.isNaN(value) ? null : value;
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

type QuestionEntry = { question: HomeworkQuestion; index: number };
type QuestionGroup = { type: string; label: string; summary: string; entries: QuestionEntry[] };

function groupSummary(questions: HomeworkQuestion[]) {
  const scores = questions.map((question) => question.score).filter((score): score is number => score != null);
  let scoreText = "";
  if (questions.length > 0 && scores.length === questions.length) {
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    scoreText = min === max ? `，每题${min}分` : `，每题${min}~${max}分`;
  }
  return `共${questions.length}小题${scoreText}`;
}

// 按题型分组展示，题号沿分组后的展示顺序连续编号
function buildGroups(questions: HomeworkQuestion[]): QuestionGroup[] {
  const byType = new Map<string, HomeworkQuestion[]>();
  for (const question of questions) {
    const list = byType.get(question.type);
    if (list) list.push(question);
    else byType.set(question.type, [question]);
  }
  let index = 0;
  return [...byType.entries()].map(([type, list]) => ({
    type,
    label: questionTypeLabels[type] ?? type,
    summary: groupSummary(list),
    entries: list.map((question) => ({ question, index: index++ })),
  }));
}

const STICKY_OFFSET = 202; // 站点导航 64 + 吸附头部 126 + 间距

export function ExamTakeView({ examId }: { examId: number }) {
  const router = useRouter();
  const { status, user } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<MyExam>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState<"draft" | "submit">();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);
  const draftsRef = useRef(drafts);
  const questionRefs = useRef(new Map<number, HTMLDivElement>());

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
  const groups = useMemo(() => buildGroups(questions), [questions]);
  const entries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const answeredCount = questions.filter((question) => isAnswered(question, drafts)).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const canWrite = item ? canWriteExam(item) : false;
  const endsAt = item ? examEndsAt(item) : null;
  const remaining = endsAt == null ? null : endsAt - now;
  const overdue = remaining != null && remaining <= 0;
  const startsAt = item ? startAtOf(item) : null;
  const startRemaining = startsAt == null ? null : startsAt - now;
  const isPending = item?.progress_status === "pending";
  const revealAnswers = Boolean(item?.show_answer_after_submit)
    && ["submitted", "scored", "timeout"].includes(item?.progress_status ?? "");
  const userName = user?.real_name || user?.nick_name || user?.phone || "–";
  const showWaiting = Boolean(item) && isPending && !canWrite && !reviewing;

  // 头部右侧：未开始=距开考倒计时，作答中=剩余倒计时，回顾态=考试成绩
  const headerLabel = canWrite
    ? "倒计时"
    : isPending
      ? "距离考试开始还有"
      : item ? examProgressLabel(item.progress_status) : "";
  const headerValue = canWrite
    ? countdownText(remaining)
    : isPending
      ? (startRemaining == null ? "待定" : countdownText(startRemaining))
      : item?.attempt?.score != null
        ? `${item.attempt.score}${item.total_score != null ? ` / ${item.total_score}` : ""}`
        : "–";

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
      setActiveIndex(0);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast({ title: "无法开始考试", description: getApiErrorMessage(err) });
    } finally {
      setStarting(false);
    }
  }

  const registerQuestionNode = useCallback((id: number, node: HTMLDivElement | null) => {
    if (node) questionRefs.current.set(id, node);
    else questionRefs.current.delete(id);
  }, []);

  const scrollToQuestion = useCallback((index: number) => {
    const entry = entries[index];
    const node = entry ? questionRefs.current.get(entry.question.id) : undefined;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveIndex(index);
  }, [entries]);

  // 题目区平铺后跟随窗口滚动，同步答题卡当前题高亮
  useEffect(() => {
    if (entries.length === 0) return;
    const onScroll = () => {
      let current = 0;
      entries.forEach((entry, index) => {
        const node = questionRefs.current.get(entry.question.id);
        if (node && node.getBoundingClientRect().top <= STICKY_OFFSET + 24) current = index;
      });
      setActiveIndex(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [entries]);

  if (status === "loading" || status === "anonymous" || loading) {
    return <div className="flex flex-1 justify-center py-20" style={{ background: "#F6F8FC" }}><Spinner label="加载考试" /></div>;
  }
  if (error || !item) {
    return (
      <div className="flex-1" style={{ background: "#F6F8FC" }}>
        <EmptyState title="无法打开考试" description={error} action={<Link href="/account" className="text-sm text-primary">返回个人中心</Link>} />
      </div>
    );
  }

  return (
    <div className="flex-1" style={{ background: "#F6F8FC" }}>
      {/* 头部：exam-bg 背景图底部对齐，超出隐藏 */}
      <header className="sticky top-16 z-20 h-[126px] overflow-hidden" style={{ background: "#F6F8FC" }}>
        <img
          src="/images/personal/exam-bg.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[190px] w-full object-cover object-bottom"
        />
        <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-center gap-[12px] px-6">
          <div className="flex h-[32px] items-center">
            <h1 className="min-w-0 truncate text-[32px] font-semibold leading-none" style={{ color: "#222324" }}>{item.title}</h1>
            <span aria-hidden className="mx-4 h-3 w-px shrink-0" style={{ background: "#CBCBCB" }} />
            <span className="flex shrink-0 items-center gap-2 text-[16px] leading-none" style={{ color: "#8C8C8C" }}>
              网络连接状态：
              <img src="/images/personal/exam-signal.png" alt="" className="h-4 w-4" width={16} height={16} />
            </span>
            <div className="ml-auto flex w-[180px] shrink-0 items-center justify-center gap-2">
              <img src="/images/personal/exam-time.png" alt="" className="h-4 w-4" width={16} height={16} />
              <span className="text-[16px] leading-none" style={{ color: "#222324" }}>{headerLabel}</span>
            </div>
          </div>
          <div className="flex items-center">
            <p className="min-w-0 flex-1 truncate text-[16px] leading-none" style={{ color: "#8C8C8C" }} title={item.description ?? ""}>
              考试说明：{item.description}
            </p>
            <div className="flex w-[180px] shrink-0 items-center justify-center">
              <span className="text-[32px] font-semibold leading-none tabular-nums" style={{ color: "#DF412C" }}>{headerValue}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="mx-auto w-full max-w-7xl px-6 pb-[40px] pt-[24px]">
        <div className="flex flex-col gap-[28px] lg:flex-row">
          {/* 左栏：考生信息 + 答题卡 */}
          <aside className="flex w-full flex-col gap-[19px] lg:sticky lg:top-[206px] lg:w-[300px] lg:shrink-0 lg:self-start">
            <div className="rounded-lg border border-[#ECECEC] bg-white px-4 py-[13px]">
              <p className="text-[16px] font-semibold" style={{ color: "#262626" }}>考生信息</p>
              <div className="mt-[6px] text-[16px]" style={{ color: "rgba(0,0,0,0.85)" }}>
                <div className="flex items-center justify-between border-t border-[#F0F0F0] py-[11px]">
                  <span>用户名：</span>
                  <span className="min-w-0 truncate pl-3">{userName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#F0F0F0] py-[11px]">
                  <span>班级：</span>
                  <span className="min-w-0 truncate pl-3">{item.class?.name ?? "–"}</span>
                </div>
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="rounded-lg border border-[#ECECEC] bg-white px-4 py-[13px]">
                <p className="text-[16px] font-semibold" style={{ color: "#262626" }}>答题卡</p>
                <div className="mt-[10px] flex items-center gap-4 text-[14px]" style={{ color: "#595959" }}>
                  <span className="flex items-center gap-2">
                    <i aria-hidden className="block h-4 w-4 rounded-[2px] border border-[#D9D9D9]" />
                    未作答
                  </span>
                  <span className="flex items-center gap-2">
                    <i aria-hidden className="block h-4 w-4 rounded-[2px]" style={{ background: "#0F62FE" }} />
                    已作答
                  </span>
                </div>
                <div className="mt-[10px] grid grid-cols-8 gap-[6px]">
                  {entries.map((entry) => {
                    const done = isAnswered(entry.question, drafts);
                    const active = entry.index === activeIndex;
                    return (
                      <button
                        key={entry.question.id}
                        type="button"
                        onClick={() => scrollToQuestion(entry.index)}
                        className={`flex h-[28px] items-center justify-center rounded-[2px] border text-[13px] ${
                          active ? "border-[#DF412C]" : "border-transparent"
                        } ${done ? "text-white" : "bg-white"}`}
                        style={done ? { background: "#0F62FE" } : { borderColor: active ? undefined : "#D9D9D9", color: "#595959" }}
                      >
                        {entry.index + 1}
                      </button>
                    );
                  })}
                </div>
                {canWrite ? (
                  <div className="mt-4 flex gap-3">
                    <Button
                      className="h-8 min-h-0 flex-1"
                      loading={saving === "submit"}
                      disabled={Boolean(saving) || overdue}
                      onClick={() => setConfirmOpen(true)}
                    >
                      我要交卷
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 min-h-0 flex-1"
                      loading={saving === "draft"}
                      disabled={Boolean(saving) || overdue}
                      onClick={() => void persist(false)}
                    >
                      保存
                    </Button>
                  </div>
                ) : item.can_start && !isPending ? (
                  <div className="mt-4 flex gap-3">
                    <Button className="h-8 min-h-0 flex-1" loading={starting} onClick={() => void handleStart()}>再考一次</Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>

          {/* 右栏：未开始提示 / 题目作答 */}
          <section className="min-w-0 flex-1">
            {showWaiting ? (
              <div className="flex min-h-[378px] flex-col items-center justify-center rounded-lg border border-[#ECECEC] bg-white px-6 py-10">
                <img src="/images/personal/exam-emty.png" alt="" className="h-[88px] w-[92px]" width={92} height={88} />
                <p className="mt-4 text-[16px]" style={{ color: "#8C8C8C" }}>考试还未开始，请耐心等候~</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {item.can_start ? (
                    <Button loading={starting} onClick={() => void handleStart()}>开始考试</Button>
                  ) : null}
                  {questions.length > 0 ? (
                    <Button variant="secondary" onClick={() => setReviewing(true)}>查看上次作答</Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                {!canWrite && isPending ? (
                  <div className="mb-3 flex justify-end">
                    <Button variant="secondary" className="h-8 min-h-0 px-[13px]" onClick={() => setReviewing(false)}>收起试卷</Button>
                  </div>
                ) : null}
                {entries.length > 0 ? (
                  <div className="rounded-lg border border-[#ECECEC] bg-white">
                    {groups.map((group) => (
                      <div key={group.type}>
                        <div className="flex items-center gap-2 px-4 py-[10px]" style={{ background: "#F6F8FC" }}>
                          <span className="text-[14px] font-medium" style={{ color: "#0F62FE" }}>{group.label}</span>
                          <span className="text-[12px]" style={{ color: "#999" }}>{group.summary}</span>
                        </div>
                        {group.entries.map((entry) => (
                          <QuestionBlock
                            key={entry.question.id}
                            index={entry.index}
                            question={entry.question}
                            locked={!canWrite}
                            reviewed={revealAnswers}
                            draft={answerOf(entry.question, drafts)}
                            onDraft={(value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [entry.question.id]: value }))}
                            registerNode={(node) => registerQuestionNode(entry.question.id, node)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[378px] items-center justify-center rounded-lg border border-[#ECECEC] bg-white">
                    <p className="text-[16px]" style={{ color: "#8C8C8C" }}>暂无题目</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

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
  registerNode,
}: {
  index: number;
  question: HomeworkQuestion;
  locked: boolean;
  reviewed: boolean;
  draft: string[];
  onDraft: (value: string[]) => void;
  registerNode: (node: HTMLDivElement | null) => void;
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
    <div ref={registerNode} className="flex gap-3 border-t px-4 py-4" style={{ borderColor: "#F0F0F0" }}>
      <span
        aria-hidden
        className="mt-[2px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded text-[13px] font-semibold text-white"
        style={{ background: "#0F62FE" }}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-6" style={{ color: "rgba(0,0,0,0.85)" }}>
          {question.stem}
          {question.score != null ? (
            <span className="ml-1 text-[13px]" style={{ color: "#999" }}>（{Number(question.score).toFixed(1)}分）</span>
          ) : null}
        </p>
        {choiceType ? (
          <div className="mt-2 grid gap-2" role={multiple ? "group" : "radiogroup"} aria-label="选项">
            {options.map((option) => {
              const key = String(option.key);
              const picked = selected.includes(key);
              const correct = showKey && question.correct_answer?.map(String).includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-start gap-2 text-[14px] leading-6 ${locked ? "" : "cursor-pointer"}`}
                  style={{ color: correct ? "#0F62FE" : picked ? "#222" : "rgba(0,0,0,0.65)" }}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    className="mt-[5px] size-[14px] shrink-0 accent-[#0F62FE]"
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
              className="min-h-[120px]"
              value={selected[0] ?? ""}
              disabled={locked}
              onChange={(event) => onDraft(event.target.value ? [event.target.value] : [])}
              placeholder="请输入答案"
            />
          </div>
        )}
        {showKey ? (
          <p className="mt-3 text-[13px] leading-6" style={{ color: "#999" }}>
            {question.correct_answer?.length ? `正确答案 ${question.correct_answer.join("、")}` : ""}
            {question.analysis ? ` · 解析：${question.analysis}` : ""}
            {question.earned_score != null ? ` · 本题 ${question.earned_score} 分` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
