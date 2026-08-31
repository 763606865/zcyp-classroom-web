"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { CourseLearn } from "@/entities/learn";
import { useAuth } from "@/features/auth/auth-provider";
import { statusLabel } from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { applyLessonProgress, flattenLessons } from "./apply-progress";
import { getCourseLearn, hasVodMedia, resolveLiveSessionId, updateLessonProgress, type LessonProgressBody } from "./api";
import { CourseChat } from "./course-chat";
import { CourseComments } from "./course-comments";
import { CourseInteractions } from "./course-interactions";
import { CourseTeacherCard } from "./course-teacher-card";
import { CoursewarePanel } from "./courseware-panel";
import { LessonMediaFrame } from "./lesson-media-frame";
import { LessonPracticePanel } from "./lesson-practice-panel";
import { LiveLessonView } from "./live-lesson";
import { StreamPlayer } from "./stream-player";
import { VodPlayer } from "./vod-player";

function lessonTypeLabel(type: string) {
  if (type === "video") return "录播";
  if (type === "live") return "直播";
  return type;
}

export function CourseLearnView({ courseId }: { courseId: number }) {
  const router = useRouter();
  const { status } = useAuth();
  const [data, setData] = useState<CourseLearn>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number>();
  const [resumeAt, setResumeAt] = useState(0);

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
  const chapters = data?.chapters ?? [];
  const liveSessionId = active && active.type === "live" ? resolveLiveSessionId(active) : null;
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

  if (status === "loading" || status === "anonymous" || loading) {
    return <div className="flex justify-center py-20"><Spinner label="加载课程" /></div>;
  }
  if (error || !data) {
    return <EmptyState title="无法打开课程" description={error} action={<Link href="/account" className="text-sm text-primary">返回个人中心</Link>} />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/account" className="hover:text-primary">个人中心</Link>
              <span> / 我的课程 / {data.course.title}</span>
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{active?.title ?? data.course.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              总进度 {data.enrollment.progress ?? 0}% · 已完成 {data.summary.completed_lessons}/{data.summary.total_lessons} 课时
            </p>
            <CourseInteractions courseId={courseId} title={data.course.title} />
          </div>
          <CourseTeacherCard
            teachers={
              data.course.teachers?.length
                ? data.course.teachers
                : data.course.teacher
                  ? [data.course.teacher]
                  : []
            }
          />
        </div>
        <div className="mt-4 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
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
            {active ? <LessonPracticePanel key={active.id} courseId={courseId} lessonId={active.id} /> : null}
          </div>
          <CourseChat courseId={courseId} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <CoursewarePanel courseId={courseId} lessonId={active?.id} />
            <CourseComments courseId={courseId} />
          </div>
          <aside>
            <Card className="p-4">
              <h2 className="font-semibold">课时目录</h2>
          <div className="mt-4 grid gap-4">
            {chapters.map((chapter) => (
              <div key={chapter.id}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{chapter.title}</p>
                <div className="grid gap-1">
                  {chapter.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setActiveId(lesson.id);
                        setResumeAt(lesson.progress?.progress_seconds ?? 0);
                      }}
                      className={`rounded-md px-3 py-2 text-left text-sm ${active?.id === lesson.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      <span className="block font-medium">{lesson.title}</span>
                      <span className={active?.id === lesson.id ? "text-xs text-white/80" : "text-xs text-muted-foreground"}>
                        {lessonTypeLabel(lesson.type)} · {statusLabel(lesson.progress?.status ?? "not_started")}
                        {lesson.progress?.progress != null ? ` · ${lesson.progress.progress}%` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {(data.ungrouped_lessons?.length ?? 0) > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">其他课时</p>
                {data.ungrouped_lessons?.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      setActiveId(lesson.id);
                      setResumeAt(lesson.progress?.progress_seconds ?? 0);
                    }}
                    className={`rounded-md px-3 py-2 text-left text-sm ${active?.id === lesson.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <span className="block font-medium">{lesson.title}</span>
                    <span className="text-xs opacity-80">{lessonTypeLabel(lesson.type)}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
            </Card>
            <Link href="/account" className="mt-4 inline-block"><Button variant="secondary">返回个人中心</Button></Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
