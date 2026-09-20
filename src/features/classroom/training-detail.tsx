'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoverImage } from '@/components/cover-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import type { TrainingCourse, TrainingDetail } from '@/entities/classroom';
import { useAuth } from '@/features/auth/auth-provider';
import { createTrainingOrder, payOrder } from '@/features/orders/api';
import { getApiErrorMessage } from '@/lib/forms';
import { getTraining } from './api';
import { formatPrice } from './labels';
import { DetailSidebar } from './course-detail';

/* ─── Helpers ─── */
function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '待定';
  const fmt = (v: string) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(d);
  };
  if (start && end) return `${fmt(start)}至${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
}

function secondsToCountdown(total: number): string {
  if (total <= 0) return '已截止';
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}天${h.toString().padStart(2, '0')}小时${m.toString().padStart(2, '0')}分`;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getLessonIcon(lesson: { type?: string; live_sessions?: { has_playback?: boolean }[] }): string {
  const hasLive = lesson.live_sessions && lesson.live_sessions.length > 0;
  if (hasLive) return '/images/course/live-icon.png';
  return '/images/course/video-icon.png';
}

function getLessonStatus(lesson: { live_sessions?: { status?: string; has_playback?: boolean }[] }): { text: string; color: string } {
  if (!lesson.live_sessions || lesson.live_sessions.length === 0) {
    return { text: '', color: '#999' };
  }
  const session = lesson.live_sessions[0];
  if (session.status === 'finished' && session.has_playback) {
    return { text: '查看回放', color: '#0F62FE' };
  }
  if (session.status === 'live') {
    return { text: '直播中', color: '#F16767' };
  }
  return { text: '未开播', color: '#F16767' };
}

/* ═════════════════════════════════════════
   Header Section
   ═══════════════════════════════════════════ */
function TrainingDetailHeader({
  training,
  onEnroll,
  submitting,
}: {
  training: TrainingDetail;
  onEnroll: () => void;
  submitting: boolean;
}) {
  const { status } = useAuth();

  // Countdown for enrollment deadline
  const enrollEndAt = training.enroll_end_at ? new Date(training.enroll_end_at).getTime() : null;
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  useEffect(() => {
    if (!enrollEndAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((enrollEndAt - Date.now()) / 1000));
      setCountdownSeconds(diff);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [enrollEndAt]);

  const teacherName = training.teachers?.[0]?.name;
  const teacherTitle = training.teachers?.[0]?.title;

  return (
    <section className="w-full bg-white" style={{ padding: '26px 0 20px' }}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="flex flex-col md:flex-row" style={{ gap: 17 }}>
          {/* Left: Training Cover Image */}
          <div className="w-full md:w-[377px] md:flex-shrink-0">
            <div className="w-full md:w-[377px]" style={{ aspectRatio: '377/212' }}>
              <CoverImage
                src={training.cover}
                alt={training.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Right: Content Area */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Title + Enroll Count */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1
                className="font-bold leading-snug"
                style={{ fontSize: 20, color: '#222' }}
              >
                {training.title}
              </h1>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ fontSize: 14, color: '#999' }}>已报名人数：</span>
                <span style={{ fontSize: 14, color: '#0F62FE', fontWeight: 600 }}>
                  {training.enroll_count ?? 0}
                </span>
                {training.max_students ? (
                  <span style={{ fontSize: 14, color: '#999' }}>/{training.max_students}</span>
                ) : null}
              </div>
            </div>

            {/* Summary */}
            <div
              className="mt-3 overflow-hidden"
              style={{
                backgroundColor: '#f4f5f9',
                padding: '14px 14px 0',
                borderRadius: 4,
                height: 70,
              }}
            >
              <p
                className="line-clamp-2"
                style={{ fontSize: 14, color: '#999', lineHeight: '22px' }}
              >
                {training.summary || '暂无简介'}
              </p>
            </div>

            {/* Price + Info */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span style={{ fontSize: 24, color: '#0F62FE', fontWeight: 700 }}>
                {formatPrice(training.is_free, training.price)}
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span style={{ fontSize: 14, color: '#999' }}>
                  {teacherTitle ? `${teacherTitle}：` : '主讲老师：'}
                  {teacherName ?? '中测讲师'}
                </span>
                <span style={{ fontSize: 14, color: '#999' }}>
                  培训时间：{formatDateRange(training.start_at, training.end_at)}
                </span>
              </div>
            </div>

            {/* Buttons + Countdown */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onEnroll}
                  disabled={submitting || training.enrolled}
                  className="rounded text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{
                    padding: '6px 26px',
                    fontSize: 14,
                    backgroundColor: '#0F62FE',
                  }}
                >
                  {submitting ? '报名中...' : training.enrolled ? '已报名' : status === 'authenticated' ? '立即报名' : '登录后报名'}
                </button>
                <Link
                  href={`/consult?source=training-detail&training=${training.slug}`}
                  className="rounded transition hover:opacity-80"
                  style={{
                    padding: '6px 26px',
                    fontSize: 14,
                    color: '#0F62FE',
                    border: '1px solid #0F62FE',
                    backgroundColor: 'transparent',
                  }}
                >
                  咨询详情
                </Link>
              </div>
              {enrollEndAt ? (
                <span style={{ fontSize: 14, color: '#999' }}>
                  报名还剩：
                  <span style={{ color: countdownSeconds <= 0 ? '#F16767' : '#FEA500' }}>
                    {secondsToCountdown(countdownSeconds)}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   Training Intro Tab Content
   ═══════════════════════════════════════════ */
function TrainingIntroContent({ training }: { training: TrainingDetail }) {
  return (
    <div>
      <h3 className="font-bold" style={{ fontSize: 16, color: '#222' }}>
        培训简介
      </h3>
      {training.description ? (
        <div
          className="mt-3"
          style={{ fontSize: 14, color: '#555', lineHeight: '24px' }}
          dangerouslySetInnerHTML={{ __html: training.description }}
        />
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Course Plan Tab Content (3-level Accordion)
   ═══════════════════════════════════════════ */
function LessonItem({
  lessonIndex,
  lesson,
}: {
  lessonIndex: number;
  lesson: TrainingCourse['chapters'] extends (infer C)[] | undefined
    ? C extends { lessons?: (infer L)[] } ? L : never
    : never;
}) {
  const iconSrc = getLessonIcon(lesson as any);
  const status = getLessonStatus(lesson as any);

  return (
    <div
      className="flex items-center justify-between rounded"
      style={{
        padding: '10px 16px',
        backgroundColor: '#f6f8fc',
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="flex-shrink-0 font-medium"
          style={{ fontSize: 14, color: '#222', minWidth: 42 }}
        >
          第{lessonIndex}节
        </span>
        <img
          src={iconSrc}
          alt=""
          width={16}
          height={16}
          className="flex-shrink-0"
        />
        <span
          className="truncate"
          style={{ fontSize: 14, color: '#222' }}
        >
          {lesson.title}
        </span>
      </div>
      {status.text ? (
        <span
          className="flex-shrink-0"
          style={{ fontSize: 14, color: status.color }}
        >
          {status.text}
        </span>
      ) : null}
    </div>
  );
}

function ChapterAccordion({
  chapter,
  chapterIndex,
}: {
  chapter: NonNullable<TrainingCourse['chapters']>[number];
  chapterIndex: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const lessons = chapter.lessons ?? [];

  return (
    <div className="border-b border-[#eee]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded px-4 py-3 text-left transition-colors hover:bg-[#f6f8fc]"
      >
        <div className="flex items-center gap-3">
          <span
            className="font-medium"
            style={{ fontSize: 14, color: '#222' }}
          >
            {chapter.title}
          </span>
        </div>
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M4 6L8 10L12 6" stroke="#999" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && lessons.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 pb-3">
          {lessons.map((lesson, li) => (
            <LessonItem key={lesson.id} lessonIndex={li + 1} lesson={lesson as any} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CourseAccordion({
  course,
  courseIndex,
}: {
  course: TrainingCourse;
  courseIndex: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const chapters = course.chapters ?? [];
  const ungroupedLessons = course.ungrouped_lessons ?? [];

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-[#eee]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#f6f8fc]"
        style={{ backgroundColor: expanded ? '#f6f8fc' : '#fff' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-bold"
            style={{ fontSize: 15, color: '#222' }}
          >
            {course.title}
          </span>
          {course.teacher?.name ? (
            <span style={{ fontSize: 13, color: '#999' }}>
              · {course.teacher.name}
            </span>
          ) : null}
          {course.lesson_count ? (
            <span style={{ fontSize: 13, color: '#999' }}>
              · {course.lesson_count}课时
            </span>
          ) : null}
        </div>
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M4 6L8 10L12 6" stroke="#999" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded ? (
        <div>
          {chapters.length > 0 ? (
            <div>
              {chapters.map((chapter, ci) => (
                <ChapterAccordion key={chapter.id} chapter={chapter} chapterIndex={ci + 1} />
              ))}
            </div>
          ) : null}
          {ungroupedLessons.length > 0 ? (
            <div className="flex flex-col gap-2 px-4 pb-3">
              {ungroupedLessons.map((lesson, li) => (
                <LessonItem key={lesson.id} lessonIndex={li + 1} lesson={lesson as any} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CoursePlanContent({ courses }: { courses: TrainingCourse[] }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="py-8 text-center" style={{ color: '#999', fontSize: 14 }}>
        暂无课程计划
      </div>
    );
  }

  return (
    <div>
      {courses.map((course, ci) => (
        <CourseAccordion key={course.id} course={course} courseIndex={ci + 1} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab Section (Left Column)
   ══════════════════════════════════════════ */
function TrainingTabSection({ training }: { training: TrainingDetail }) {
  const [activeTab, setActiveTab] = useState<'intro' | 'plan'>('intro');
  const courses = training.courses ?? [];

  return (
    <div className="rounded-lg bg-white p-6">
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: '#eee' }}>
        <button
          type="button"
          onClick={() => setActiveTab('intro')}
          className="pb-3 transition-colors"
          style={{
            fontSize: 16,
            fontWeight: activeTab === 'intro' ? 700 : 400,
            color: activeTab === 'intro' ? '#0F62FE' : '#222',
            borderBottom:
              activeTab === 'intro' ? '2px solid #0F62FE' : '2px solid transparent',
          }}
        >
          培训介绍
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plan')}
          className="ml-8 pb-3 transition-colors"
          style={{
            fontSize: 16,
            fontWeight: activeTab === 'plan' ? 700 : 400,
            color: activeTab === 'plan' ? '#0F62FE' : '#222',
            borderBottom:
              activeTab === 'plan' ? '2px solid #0F62FE' : '2px solid transparent',
          }}
        >
          课程计划
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-5">
        {activeTab === 'intro' ? (
          <TrainingIntroContent training={training} />
        ) : (
          <CoursePlanContent courses={courses} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Content Area (Below Header)
   ═══════════════════════════════════════════ */
function TrainingMainContent({ training }: { training: TrainingDetail }) {
  return (
    <section className="w-full" style={{ backgroundColor: '#f6f8fc' }}>
      <div
        className="mx-auto max-w-[1200px] px-4 md:px-6"
        style={{ paddingTop: 24, paddingBottom: 40 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row" style={{ gap: 16 }}>
          {/* Left: Tab Content */}
          <div className="min-w-0 flex-1 lg:w-[calc(100%-320px)]">
            <TrainingTabSection training={training} />
          </div>
          {/* Right: Sidebar */}
          <div className="w-full lg:w-[304px] lg:flex-shrink-0">
            <DetailSidebar />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Main View Export
   ═══════════════════════════════════════════ */
export function TrainingDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const { toast } = useToast();
  const [training, setTraining] = useState<TrainingDetail>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void getTraining(slug)
      .then((result) => {
        if (!cancelled) setTraining(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, '培训详情加载失败'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, mounted]);

  async function enroll() {
    if (status !== 'authenticated') {
      router.push(`/login?next=/trainings/${encodeURIComponent(slug)}`);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTrainingOrder(slug, 'auto');
      if (!created.data.paid) {
        await payOrder(created.data.order.order_no, 'mock');
      }
      toast({ title: '报名成功', description: '正在打开我的培训详情。' });
      router.push(`/account/trainings/${encodeURIComponent(slug)}`);
    } catch (err) {
      toast({ title: '报名失败', description: getApiErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !training) {
    return <EmptyState title="培训不存在或未上架" description={error} />;
  }

  return (
    <div>
      <TrainingDetailHeader training={training} onEnroll={enroll} submitting={submitting} />
      <TrainingMainContent training={training} />
    </div>
  );
}
