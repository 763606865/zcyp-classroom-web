'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CoverImage } from '@/components/cover-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import type { CourseCard, CourseChapter, CourseDetail, CourseLesson } from '@/entities/classroom';
import { getApiErrorMessage } from '@/lib/forms';
import { getCourseDetail, getHotCourses } from './api';
import { formatPrice, getLikeIconCount, trainingTypeColors, trainingTypeLabels } from './labels';

/* ─── Helpers ─── */
function formatTotalDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

function getLessonIcon(lesson: { type?: string; live_sessions?: { has_playback?: boolean }[] }): string {
  const hasLive = lesson.live_sessions && lesson.live_sessions.length > 0;
  if (hasLive) return '/images/course/live-icon.png';
  return '/images/course/video-icon.png';
}

function getLessonStatus(lesson: { live_sessions?: { status?: string | null; has_playback?: boolean }[] }): { text: string; color: string } {
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
  return { text: '', color: '#999' };
}

/* ─── Static data (FAQ & QR code not provided by API) ─── */
const staticFaq = [
  { question: '如何查看已购课程？', answer: '点击个人中心然后选择我的课程' },
  { question: '课程购买后可以更换吗？', answer: '课程购买后不支持更换，请确认后再购买。' },
  { question: '直播结束后会有回放吗？', answer: '直播结束后会生成回放，可在课程章节中观看。' },
  { question: '无法登录怎么办？', answer: '请检查账号密码是否正确，或联系客服热线。' },
  { question: '如何用手机听课？', answer: '关注中测高科公众号，在菜单中找到我的课程即可。' },
  { question: '课程过期了怎么办？', answer: '课程过期后可联系客服申请延期，具体以平台规则为准。' },
];

const qrTextPrimary = '关注中测高科公众号';

/* ─── Like Icon ─── */
function LikeIcon({ className }: { className?: string }) {
  return (
    <img
      src="/images/course/like-icon.png"
      alt="推荐"
      className={className}
      width={16}
      height={16}
    />
  );
}

function RefreshIcon() {
  return (
    <img
      src="/images/course/refresh-icon.png"
      alt=""
      width={16}
      height={16}
      className="mr-1 inline-block"
    />
  );
}

/* ══════════════════════════════════════════
   Header Section
   ═══════════════════════════════════════════ */
function CourseDetailHeader({ course }: { course: CourseDetail }) {
  const likeCount = getLikeIconCount(course.like_count);

  return (
    <section className="w-full bg-white" style={{ padding: '26px 0 20px' }}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="flex flex-col md:flex-row" style={{ gap: 17 }}>
          {/* Left: Course Image */}
          <div className="w-full md:w-[377px] md:flex-shrink-0">
            <div className="w-full md:w-[377px]" style={{ aspectRatio: '377/212' }}>
              <CoverImage
                src={course.cover}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Right: Content Area */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Title + Recommendation */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1
                className="font-bold leading-snug"
                style={{ fontSize: 20, color: '#222' }}
              >
                {course.title}
              </h1>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ fontSize: 14, color: '#999' }}>推荐值：</span>
                {Array.from({ length: likeCount }).map((_, i) => (
                  <LikeIcon key={i} className="h-4 w-4" />
                ))}
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
                {course.summary || '暂无简介'}
              </p>
            </div>

            {/* Price + Info */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span style={{ fontSize: 24, color: '#0F62FE', fontWeight: 700 }}>
                ¥{course.price}
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span style={{ fontSize: 14, color: '#999' }}>
                  {course.teacher?.title ? `${course.teacher.title}：` : '主讲老师：'}
                  {course.teacher?.name ?? '中测讲师'}
                </span>
                <span style={{ fontSize: 14, color: '#999' }}>
                  总时长：{formatTotalDuration(course.duration_minutes ?? 0)}
                </span>
                {course.enroll_count != null ? (
                  <span style={{ fontSize: 14, color: '#999' }}>
                    报名人数：{course.enroll_count}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-7">
              <button
                type="button"
                className="rounded text-white transition hover:opacity-90"
                style={{
                  padding: '6px 26px',
                  fontSize: 14,
                  backgroundColor: '#0F62FE',
                }}
              >
                立即购买
              </button>
              <Link
                href={`/consult?source=course-detail&course=${course.id}`}
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
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Course Intro Tab Content
   ═══════════════════════════════════════════ */
function CourseIntroContent({ course }: { course: CourseDetail }) {
  return (
    <div>
      <h3 className="font-bold" style={{ fontSize: 16, color: '#222' }}>
        课程简介
      </h3>
      {course.description ? (
        <div
          className="mt-3"
          style={{ fontSize: 14, color: '#555', lineHeight: '24px' }}
          dangerouslySetInnerHTML={{ __html: course.description }}
        />
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Course Chapters Tab Content
   ═══════════════════════════════════════════ */
function LessonRow({
  lessonIndex,
  lesson,
}: {
  chapterIndex?: number;
  lessonIndex: number;
  lesson: CourseLesson;
}) {
  const iconSrc = getLessonIcon(lesson);
  const status = getLessonStatus(lesson);

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
}: {
  chapter: CourseChapter;
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
          <span className="font-medium" style={{ fontSize: 14, color: '#222' }}>
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
        <div className="flex flex-col gap-2 px-4 pb-3 pt-1">
          {lessons.map((lesson, li) => (
            <LessonRow key={lesson.id} lessonIndex={li + 1} lesson={lesson} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CourseChaptersContent({
  chapters,
  ungroupedLessons,
}: {
  chapters: CourseChapter[];
  ungroupedLessons: CourseLesson[];
}) {
  return (
    <div>
      {chapters.map((chapter) => (
        <ChapterAccordion key={chapter.id} chapter={chapter} />
      ))}
      {ungroupedLessons.length > 0 ? (
        <div className="flex flex-col gap-2 pt-2">
          {ungroupedLessons.map((lesson, li) => (
            <LessonRow key={lesson.id} lessonIndex={li + 1} lesson={lesson} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tab Section (Left Column)
   ══════════════════════════════════════════ */
function CourseTabSection({ course }: { course: CourseDetail }) {
  const [activeTab, setActiveTab] = useState<'intro' | 'chapters'>('intro');
  const chapters = course.chapters ?? [];
  const ungroupedLessons = course.ungrouped_lessons ?? [];

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
          课程介绍
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chapters')}
          className="ml-8 pb-3 transition-colors"
          style={{
            fontSize: 16,
            fontWeight: activeTab === 'chapters' ? 700 : 400,
            color: activeTab === 'chapters' ? '#0F62FE' : '#222',
            borderBottom:
              activeTab === 'chapters' ? '2px solid #0F62FE' : '2px solid transparent',
          }}
        >
          课程章节
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-5">
        {activeTab === 'intro' ? (
          <CourseIntroContent course={course} />
        ) : (
          <CourseChaptersContent chapters={chapters} ungroupedLessons={ungroupedLessons} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   QR Code Section (Right Column)
   ═══════════════════════════════════════════ */
function QrCodeSection() {
  return (
    <div
      className="flex items-center gap-4 bg-white"
      style={{ padding: '16px 16px 18px', borderRadius: 8 }}
    >
      {/* QR Code */}
      <div
        className="flex-shrink-0 overflow-hidden rounded bg-gray-100"
        style={{ width: 90, height: 90 }}
      >
        <div className="flex h-full w-full items-center justify-center" style={{ fontSize: 12, color: '#999' }}>
          <svg width={70} height={70} viewBox="0 0 70 70" fill="none">
            <rect x="5" y="5" width="20" height="20" rx="2" stroke="#333" strokeWidth="2" />
            <rect x="10" y="10" width="10" height="10" rx="1" fill="#333" />
            <rect x="45" y="5" width="20" height="20" rx="2" stroke="#333" strokeWidth="2" />
            <rect x="50" y="10" width="10" height="10" rx="1" fill="#333" />
            <rect x="5" y="45" width="20" height="20" rx="2" stroke="#333" strokeWidth="2" />
            <rect x="10" y="50" width="10" height="10" rx="1" fill="#333" />
            <rect x="30" y="5" width="8" height="8" fill="#333" />
            <rect x="42" y="5" width="4" height="4" fill="#333" />
            <rect x="30" y="18" width="12" height="4" fill="#333" />
            <rect x="5" y="30" width="4" height="10" fill="#333" />
            <rect x="14" y="30" width="8" height="4" fill="#333" />
            <rect x="26" y="30" width="4" height="12" fill="#333" />
            <rect x="35" y="30" width="10" height="4" fill="#333" />
            <rect x="50" y="30" width="4" height="8" fill="#333" />
            <rect x="58" y="30" width="7" height="4" fill="#333" />
            <rect x="30" y="45" width="8" height="4" fill="#333" />
            <rect x="42" y="45" width="4" height="12" fill="#333" />
            <rect x="50" y="45" width="8" height="4" fill="#333" />
            <rect x="62" y="45" width="4" height="8" fill="#333" />
            <rect x="30" y="55" width="4" height="10" fill="#333" />
            <rect x="38" y="55" width="8" height="4" fill="#333" />
            <rect x="50" y="55" width="4" height="10" fill="#333" />
            <rect x="58" y="58" width="8" height="8" rx="1" fill="#333" />
          </svg>
        </div>
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 16, color: '#222', fontWeight: 500 }}>
          {qrTextPrimary}
          <span style={{ color: '#0F62FE' }}>职业技能培训</span>
          ，职业考证、求职招聘一网打尽
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FAQ Section (Right Column)
   ══════════════════════════════════════════ */
function FaqItemRow({
  item,
  hoveredIndex,
  setHoveredIndex,
  index,
}: {
  item: { question: string; answer: string };
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
  index: number;
}) {
  const isHovered = hoveredIndex === index;
  return (
    <div
      className="relative flex items-center rounded transition-colors"
      style={{
        padding: '4px 0',
        fontSize: 16,
        color: '#222',
        lineHeight: '28px',
        backgroundColor: isHovered ? '#f3f7ff' : 'transparent',
      }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Dot - 8px from left */}
      <span
        className="flex-shrink-0 rounded-full"
        style={{
          width: 10,
          height: 10,
          marginLeft: 8,
          marginRight: 12,
          backgroundColor: isHovered ? '#0f62fe' : '#e7efff',
          transition: 'background-color 0.2s',
        }}
      />
      {/* Question */}
      <span className="flex-shrink-0">{item.question}</span>

      {/* Tooltip answer */}
      {isHovered ? (
        <div
          className="pointer-events-none absolute z-50 rounded shadow-lg"
          style={{
            left: 20,
            top: '100%',
            marginTop: 2,
            padding: '8px 14px',
            backgroundColor: '#fff',
            border: '1px solid #e8e8e8',
            fontSize: 14,
            color: '#666',
            lineHeight: '22px',
            whiteSpace: 'normal',
            maxWidth: 'calc(100% - 40px)',
          }}
        >
          {item.answer}
        </div>
      ) : null}
    </div>
  );
}

function FaqSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return (
    <div
      className="bg-white"
      style={{ padding: '13px 16px 19px', borderRadius: 8 }}
    >
      <h3 className="font-bold" style={{ fontSize: 16, color: '#222' }}>
        常见问题
      </h3>
      <div className="mt-2 flex flex-col">
        {staticFaq.map((item, idx) => (
          <FaqItemRow
            key={idx}
            item={item}
            index={idx}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Recommend Course Card (Right Column)
   ═══════════════════════════════════════════ */
function RecommendCourseCard({ course }: { course: CourseCard }) {
  const likeCount = getLikeIconCount(course.like_count);
  const typeColor = trainingTypeColors[course.type] ?? '#555';
  const typeLabel = trainingTypeLabels[course.type] ?? course.type;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="block overflow-hidden rounded-lg border border-[#ECECEC] bg-white transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative w-full" style={{ paddingBottom: '56.29%' }}>
        <CoverImage
          src={course.cover}
          alt={course.title}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {/* Content */}
      <div style={{ padding: '12px 17px 13px' }}>
        <h3
          className="line-clamp-2 font-medium"
          style={{ fontSize: 16, lineHeight: '24px', color: '#222' }}
        >
          {course.title}
        </h3>
        <p className="mt-[10px]" style={{ fontSize: 14, color: '#555' }}>
          {course.teacher?.name ?? '中测讲师'}
          {course.lesson_count ? ` · ${course.lesson_count}课时` : ''}
        </p>
        <div className="mt-[13px] flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 14, color: '#555' }}>推荐值：</span>
            {Array.from({ length: likeCount }).map((_, i) => (
              <LikeIcon key={i} className="h-4 w-4" />
            ))}
          </div>
          <span style={{ fontSize: 14, color: typeColor }}>
            授课方式：{typeLabel}
          </span>
        </div>
        <div
          className="mt-[14px]"
          style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
        />
        <div className="mt-[11px] flex items-center justify-between">
          <span
            className="inline-flex items-center rounded"
            style={{
              padding: '2px 7px',
              fontSize: 14,
              color: '#0F62FE',
              border: '1px solid #0F62FE',
            }}
          >
            咨询课程
          </span>
          <span style={{ fontSize: 16, color: '#0F62FE', fontWeight: 600 }}>
            {formatPrice(course.is_free, course.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════
   Recommend Section (Right Column)
   ═══════════════════════════════════════════ */
function RecommendSection() {
  const [courses, setCourses] = useState<CourseCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getHotCourses({ per_page: 12, page: 1 })
      .then(result => {
        if (cancelled) return;
        setCourses(result.data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [displayCourses, setDisplayCourses] = useState(courses);

  // Keep displayCourses in sync when courses load
  useEffect(() => {
    setDisplayCourses(courses);
  }, [courses]);

  const handleRefresh = () => {
    const shuffled = [...courses].sort(() => Math.random() - 0.5);
    setDisplayCourses(shuffled);
  };

  return (
    <div
      className="bg-white"
      style={{ padding: '16px 16px 32px', borderRadius: 8 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold" style={{ fontSize: 16, color: '#222' }}>
          为你推荐
        </h3>
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center transition-colors hover:opacity-70"
          style={{ fontSize: 14, color: '#999' }}
        >
          <RefreshIcon />
          换一批
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {displayCourses.slice(0, 1).map(course => (
          <RecommendCourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sidebar (Right Column)
   ═══════════════════════════════════════════ */
export function DetailSidebar() {
  return (
    <div className="flex flex-col gap-4">
      <QrCodeSection />
      <FaqSection />
      <RecommendSection />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Content Area (Below Header)
   ═══════════════════════════════════════════ */
function CourseMainContent({ course }: { course: CourseDetail }) {
  return (
    <section className="w-full" style={{ backgroundColor: '#f6f8fc' }}>
      <div
        className="mx-auto max-w-[1200px] px-4 md:px-6"
        style={{ paddingTop: 24, paddingBottom: 40 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row" style={{ gap: 16 }}>
          {/* Left: Tab Content */}
          <div className="min-w-0 flex-1 lg:w-[calc(100%-320px)]">
            <CourseTabSection course={course} />
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
export function CourseDetailView({ courseId }: { courseId: number }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getCourseDetail(courseId)
      .then(result => {
        if (!cancelled) setCourse(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, '课程详情加载失败'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !course) {
    return <EmptyState title="课程加载失败" description={error ?? '请稍后重试'} />;
  }

  return (
    <div>
      <CourseDetailHeader course={course} />
      <CourseMainContent course={course} />
    </div>
  );
}
