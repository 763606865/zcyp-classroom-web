"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { CourseLearn } from "@/entities/learn";
import { useAuth } from "@/features/auth/auth-provider";
import {
  CourseChaptersContent,
  DetailSidebar,
  type ChapterGroupLike,
  type ChapterLessonLike,
} from "@/features/classroom/course-detail";
import { getApiErrorMessage } from "@/lib/forms";
import { applyLessonProgress, flattenLessons } from "./apply-progress";
import { getCourseLearn, hasVodMedia, pickLiveSession, resolveLiveSessionId, updateLessonProgress, type LessonProgressBody } from "./api";
import { CourseChat } from "./course-chat";
import { CourseComments } from "./course-comments";
import { CourseHomeworks } from "./course-homeworks";
import { CourseInteractions } from "./course-interactions";
import { CourseTeacherCard } from "./course-teacher-card";
import { CoursewareDialog } from "./courseware-panel";
import { LessonMediaFrame } from "./lesson-media-frame";
import { LessonPracticePanel } from "./lesson-practice-panel";
import { LiveLessonView } from "./live-lesson";
import { StreamPlayer } from "./stream-player";
import { VodPlayer } from "./vod-player";

type LearnTab = "chapters" | "homeworks" | "comments";

const learnTabs: { id: LearnTab; label: string }[] = [
  { id: "chapters", label: "课程章节" },
  { id: "homeworks", label: "课后作业" },
  { id: "comments", label: "评论" },
];

function findLessonCode(data: CourseLearn, lessonId?: number): string | undefined {
  if (lessonId == null) return undefined;
  const chapters = data.chapters ?? [];
  for (let ci = 0; ci < chapters.length; ci += 1) {
    const lessons = chapters[ci].lessons ?? [];
    const li = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (li >= 0) return `${ci + 1}.${li + 1}`;
  }
  return undefined;
}

function formatMetaTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function MetaItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: 14, color: "#555" }}>
      <img src={icon} alt="" width={16} height={16} className="flex-shrink-0" />
      {text}
    </span>
  );
}

export function CourseLearnView({ courseId }: { courseId: number }) {
  const router = useRouter();
  const { status } = useAuth();
  const [data, setData] = useState<CourseLearn>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number>();
  const [resumeAt, setResumeAt] = useState(0);
  const [activeTab, setActiveTab] = useState<LearnTab>("chapters");
  const [coursewareOpen, setCoursewareOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileUrl, setMobileUrl] = useState("");

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=/account/courses/${courseId}`);
  }, [courseId, router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void getCourseLearn(courseId)
        .then((result) => {
          if (cancelled) return;
          setData(result.data);
          const lessons = flattenLessons(result.data);
          const nextId = result.data.summary.continue_lesson_id ?? lessons[0]?.id;
          setActiveId(nextId);
          const next = lessons.find((item) => item.id === nextId);
          setResumeAt(next?.progress?.progress_seconds ?? 0);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(getApiErrorMessage(err, "课程学习详情加载失败"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [courseId, status]);

  const lessons = useMemo(() => (data ? flattenLessons(data) : []), [data]);
  const active = lessons.find((item) => item.id === activeId) ?? lessons[0];
  const chapters: ChapterGroupLike[] = data?.chapters ?? [];
  const ungroupedLessons: ChapterLessonLike[] = data?.ungrouped_lessons ?? [];
  const liveSessionId = active && active.type === "live" ? resolveLiveSessionId(active) : null;
  const liveSession = active ? pickLiveSession(active.live_sessions) : undefined;
  const startAt = liveSession?.actual_start_at ?? liveSession?.scheduled_start_at ?? undefined;
  const onlineRaw = liveSession ? (liveSession as { online_count?: unknown }).online_count : undefined;
  const onlineCount = typeof onlineRaw === "number" ? onlineRaw : undefined;
  const lessonCode = data ? findLessonCode(data, active?.id) : undefined;
  const activeRef = useRef(active);
  const sending = useRef(false);
  const queue = useRef<{ lessonId: number; body: LessonProgressBody }[]>([]);

  useEffect(() => {
    activeRef.current = active;
  });

  async function flushProgress(lessonId: number, body: LessonProgressBody) {
    queue.current.push({ lessonId, body });
    if (sending.current) return;
    sending.current = true;
    try {
      while (queue.current.length > 0) {
        const next = queue.current.shift();
        if (!next) break;
        if (next.body.progress_seconds == null && next.body.completed == null) continue;
        const result = await updateLessonProgress(courseId, next.lessonId, next.body);
        setData((current) => current
          ? applyLessonProgress(current, next.lessonId, result.data.lesson_progress, result.data.course_progress)
          : current);
      }
    } catch {
      // 进度上报失败不打断播放。
    } finally {
      sending.current = false;
      if (queue.current.length > 0) {
        const leftover = queue.current.shift();
        if (leftover) void flushProgress(leftover.lessonId, leftover.body);
      }
    }
  }

  function reportVideoProgress(seconds: number, completed = false) {
    const lesson = activeRef.current;
    if (!lesson || lesson.type !== "video") return;
    if (lesson.progress?.status === "completed" && !completed) return;
    const last = lesson.progress?.progress_seconds ?? 0;
    if (!completed && seconds <= last) return;
    const body: LessonProgressBody = completed
      ? { completed: true, progress_seconds: Math.max(0, Math.floor(seconds)) }
      : { progress_seconds: Math.max(0, Math.floor(seconds)) };
    void flushProgress(lesson.id, body);
  }

  function reportLiveProgress(body: LessonProgressBody) {
    const lesson = activeRef.current;
    if (!lesson || lesson.type !== "live") return;
    if (lesson.progress?.status === "completed" && !body.completed) return;
    void flushProgress(lesson.id, body);
  }

  function switchLesson(lesson: ChapterLessonLike) {
    setActiveId(lesson.id);
    const target = lessons.find((item) => item.id === lesson.id);
    setResumeAt(target?.progress?.progress_seconds ?? 0);
  }

  if (status === "loading" || status === "anonymous" || loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载课程" /></div>;
  }
  if (error || !data) {
    return <EmptyState title="无法打开课程" description={error} action={<Link href="/account" className="text-sm text-primary">返回个人中心</Link>} />;
  }

  return (
    <div style={{ backgroundColor: "#f6f8fc" }}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {/* ─── 上部分：播放区 + 讲师/聊天 ─── */}
        <div className="flex flex-col lg:flex-row" style={{ gap: 16 }}>
          {/* 左：标题 / 数据 / 播放器 / 操作条（同一白色区块，高度为基准，右侧匹配） */}
          <div className="flex min-w-0 flex-1 flex-col rounded-lg bg-white lg:self-start" style={{ padding: "20px 24px 16px" }}>
            <h1 className="font-bold" style={{ fontSize: 20, color: "#222" }}>
              {`${data.course.title}${lessonCode ? `-${lessonCode}` : ""}`}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
              {startAt ? <MetaItem icon="/images/study/study-time.png" text={formatMetaTime(startAt)} /> : null}
              {onlineCount != null ? (
                <MetaItem icon="/images/study/study-view.png" text={`${onlineCount}人正在观看`} />
              ) : null}
            </div>

            <div className="mt-4">
              <LessonMediaFrame>
                {!active ? (
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">暂无课时</div>
                ) : active.type === "live" && liveSessionId ? (
                  <LiveLessonView
                    key={`${active.id}-${liveSessionId}`}
                    sessionId={liveSessionId}
                    initialSeconds={active.progress?.progress_seconds ?? 0}
                    onReport={reportLiveProgress}
                  />
                ) : active.type === "live" && !liveSessionId ? (
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
                    直播课时缺少场次信息，请稍后重试或联系教务。
                  </div>
                ) : active.type === "video" && hasVodMedia(active.media_id) ? (
                  <VodPlayer
                    key={active.id}
                    courseId={courseId}
                    lessonId={active.id}
                    startAt={resumeAt}
                    onProgress={(seconds) => reportVideoProgress(seconds)}
                    onEnded={(seconds) => reportVideoProgress(seconds || active.duration_seconds || 0, true)}
                  />
                ) : active.media_url ? (
                  <StreamPlayer
                    key={active.id}
                    src={active.media_url}
                    startAt={resumeAt}
                    onProgress={(seconds) => reportVideoProgress(seconds)}
                    onEnded={(seconds) => reportVideoProgress(seconds || active.duration_seconds || 0, true)}
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                    该课时暂无播放地址（当前支持录播视频与直播）。
                  </div>
                )}
              </LessonMediaFrame>
            </div>

            <div className="mt-4">
              <CourseInteractions
                courseId={courseId}
                title={data.course.title}
                onOpenCourseware={() => setCoursewareOpen(true)}
                onOpenMobile={() => {
                  setMobileUrl(typeof window === "undefined" ? "" : window.location.href);
                  setMobileOpen(true);
                }}
              />
            </div>
          </div>

          {/* 右：讲师 + 聊天互动 */}
          <aside className="flex w-full flex-col lg:w-[304px] lg:flex-shrink-0" style={{ gap: 16 }}>
            <CourseTeacherCard
              teachers={
                data.course.teachers?.length
                  ? data.course.teachers
                  : data.course.teacher
                    ? [data.course.teacher]
                    : []
              }
            />
            <CourseChat courseId={courseId} />
          </aside>
        </div>

        {/* ─── 下部分：课堂作业 + Tab 区 + 右侧栏 ─── */}
        <div className="mt-4 flex flex-col lg:flex-row" style={{ gap: 16 }}>
          <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 16 }}>
            {active ? (
              <LessonPracticePanel
                key={active.id}
                courseId={courseId}
                lessonId={active.id}
                lessonCode={lessonCode}
              />
            ) : null}

            <div className="rounded-lg bg-white" style={{ padding: "16px 24px 24px" }}>
              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: "#eee" }}>
                {learnTabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 transition-colors ${index > 0 ? "ml-8" : ""}`}
                    style={{
                      fontSize: 16,
                      fontWeight: activeTab === tab.id ? 700 : 400,
                      color: activeTab === tab.id ? "#0F62FE" : "#222",
                      borderBottom: activeTab === tab.id ? "2px solid #0F62FE" : "2px solid transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="mt-5">
                {activeTab === "chapters" ? (
                  <CourseChaptersContent
                    chapters={chapters}
                    ungroupedLessons={ungroupedLessons}
                    activeLessonId={active?.id}
                    onLessonClick={switchLesson}
                  />
                ) : null}
                {activeTab === "homeworks" ? <CourseHomeworks courseId={courseId} /> : null}
                {activeTab === "comments" ? <CourseComments courseId={courseId} /> : null}
              </div>
            </div>
          </div>

          {/* 右侧栏：二维码 / 常见问题 / 为你推荐 */}
          <aside className="w-full lg:w-[304px] lg:flex-shrink-0">
            <DetailSidebar />
          </aside>
        </div>
      </div>

      {/* 弹窗：课件下载 / 手机观看 */}
      <CoursewareDialog courseId={courseId} open={coursewareOpen} onOpenChange={setCoursewareOpen} />
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>手机观看</DialogTitle>
          <DialogDescription>手机扫码，随时随地继续学习</DialogDescription>
          <div className="mt-4 flex justify-center rounded-card border border-border bg-white p-4">
            {mobileUrl ? <QRCodeSVG value={mobileUrl} size={200} level="M" marginSize={2} /> : null}
          </div>
          {mobileUrl ? <p className="mt-4 break-all text-center text-xs text-muted-foreground">{mobileUrl}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
