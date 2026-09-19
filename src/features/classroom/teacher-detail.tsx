"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { CourseCard, TeacherProfile, TrainingCard } from "@/entities/classroom";
import { UserAvatar, avatarImageSrc } from "@/features/user/user-avatar";
import { getApiErrorMessage } from "@/lib/forms";
import { getTeacher } from "./api";
import { formatPrice, stripHtml, trainingTypeColors, trainingTypeLabels } from "./labels";

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

function getLikeIconCount(likeCount?: number | null): number {
  if (!likeCount || likeCount <= 0) return 0;
  const count = Math.ceil(likeCount / 10);
  return Math.min(count, 5);
}

/* ─── Header Section ─── */
function TeacherHeaderSection({ teacher }: { teacher: TeacherProfile }) {
  const tags = [
    "一线授课经验",
    "岗位案例教学",
    "考核要点辅导",
  ];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 358 }}
    >
      {/* Background image - bottom aligned, full width */}
      <Image
        src="/images/teacher/detail-bg.png"
        alt=""
        width={1440}
        height={422}
        className="absolute inset-x-0 bottom-0 h-full w-full object-cover"
        priority
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col items-center">
        {/* Avatar - 29px from top */}
        <div
          className="overflow-hidden rounded-full bg-white"
          style={{ marginTop: 29, width: 116, height: 116 }}
        >
          <UserAvatar
            name={teacher.name}
            src={avatarImageSrc(teacher.avatar)}
            className="size-full"
          />
        </div>

        {/* Name - 12px below avatar */}
        <h1
          className="mt-3 font-bold"
          style={{ fontSize: 20, color: "#222222" }}
        >
          {teacher.name}
        </h1>

        {/* Expertise/Title - 12px below name */}
        <p
          className="mt-3"
          style={{ fontSize: 14, color: "#222222" }}
        >
          {teacher.expertise ?? teacher.title ?? "讲师"}
        </p>

        {/* Bio - 12px below expertise */}
        {stripHtml(teacher.bio) ? (
          <p
            className="mt-3 text-center"
            style={{
              fontSize: 14,
              color: "#999999",
              lineHeight: "30px",
              maxWidth: 795,
            }}
          >
            {stripHtml(teacher.bio)}
          </p>
        ) : null}

        {/* Tags - 12px below bio */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-block"
              style={{
                padding: "2px 10px",
                background: "rgba(0, 98, 255, 0.63)",
                color: "#ffffff",
                fontSize: 14,
                borderRadius: 4,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main View ─── */
type TabKey = "courses" | "trainings";

/* ── Navigation Anchor ─── */
function TeacherNav({
  activeSection,
}: {
  activeSection: TabKey;
}) {
  const items: { key: TabKey; label: string; href: string }[] = [
    { key: "courses", label: "课程教学", href: "#courses-section" },
    { key: "trainings", label: "培训项目", href: "#trainings-section" },
  ];

  return (
    <div
      className="sticky top-0 z-20 flex w-full items-end justify-center gap-12"
      style={{ height: 48, background: "#ffffff" }}
    >
      {items.map((item) => {
        const isActive = activeSection === item.key;
        return (
          <a
            key={item.key}
            href={item.href}
            className="transition-colors"
            style={{
              fontSize: 18,
              color: isActive ? "#0F62FE" : "#222222",
              fontWeight: isActive ? 700 : 400,
              paddingBottom: 10,
              borderBottom: isActive ? "2px solid #0F62FE" : "2px solid transparent",
            }}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}

/* ─── Course Card (参考热门课程全部课程列表样式) ── */
function CourseCardItemStyled({ course }: { course: CourseCard }) {
  const likeCount = getLikeIconCount(course.like_count);
  const typeColor = trainingTypeColors[course.type] ?? "#555";
  const typeLabel = trainingTypeLabels[course.type] ?? course.type;

  return (
    <div className="overflow-hidden rounded-lg border border-[#ECECEC] bg-white">
      {/* Image */}
      <div className="relative w-full" style={{ paddingBottom: "56.29%" }}>
        <Image
          src={course.cover ?? "/images/course/bg.png"}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>
      {/* Content */}
      <div style={{ padding: "12px 17px 13px" }}>
        {/* Title */}
        <h3
          className="line-clamp-2 font-medium"
          style={{ fontSize: 16, lineHeight: "24px", color: "#222" }}
        >
          {course.title}
        </h3>
        {/* Teacher + lessons */}
        <p className="mt-[10px]" style={{ fontSize: 14, color: "#555" }}>
          {course.teacher?.name ?? "中测讲师"}
          {course.lesson_count ? ` · ${course.lesson_count}课时` : ""}
        </p>
        {/* Like + type */}
        <div className="mt-[13px] flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 14, color: "#555" }}>推荐值：</span>
            {Array.from({ length: likeCount }).map((_, i) => (
              <LikeIcon key={i} className="h-4 w-4" />
            ))}
          </div>
          <span style={{ fontSize: 14, color: typeColor }}>
            授课方式：{typeLabel}
          </span>
        </div>
        {/* Divider */}
        <div
          className="mt-[14px]"
          style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }}
        />
        {/* Button + Price */}
        <div className="mt-[11px] flex items-center justify-between">
          <Link
            href={`/consult?source=teacher-course&course=${course.id}`}
            className="inline-flex items-center rounded"
            style={{
              padding: "2px 7px",
              fontSize: 14,
              color: "#0F62FE",
              border: "1px solid #0F62FE",
              backgroundColor: "transparent",
            }}
          >
            咨询课程
          </Link>
          <span style={{ fontSize: 16, color: "#0F62FE", fontWeight: 600 }}>
            {formatPrice(course.is_free, course.price)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Training Card (参考首页热门课程卡片 + 授课方式) ─── */
function TrainingCardItemStyled({ training }: { training: TrainingCard }) {
  const typeColor = trainingTypeColors[training.type] ?? "#555";
  const typeLabel = trainingTypeLabels[training.type] ?? training.type;

  return (
    <Link href={`/trainings/${training.slug}`} className="block">
      <div className="overflow-hidden rounded-lg border border-[#ECECEC] bg-white transition hover:border-primary">
        {/* Image */}
        <div className="relative w-full" style={{ paddingBottom: "56.29%" }}>
          <Image
            src={training.cover ?? "/images/course/bg.png"}
            alt={training.title}
            fill
            className="object-cover"
          />
        </div>
        {/* Content */}
        <div style={{ padding: "12px 17px 13px" }}>
          {/* Title */}
          <h3
            className="line-clamp-2 font-medium"
            style={{ fontSize: 16, lineHeight: "24px", color: "#222" }}
          >
            {training.title}
          </h3>
          {/* Teacher + type */}
          <div className="mt-[10px] flex items-center justify-between">
            <span style={{ fontSize: 14, color: "#555" }}>
              讲师{training.category?.name ?? ""}
            </span>
            <span style={{ fontSize: 14, color: typeColor }}>
              授课方式：{typeLabel}
            </span>
          </div>
          {/* Divider */}
          <div
            className="mt-[14px]"
            style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }}
          />
          {/* Enroll count + Price */}
          <div className="mt-[11px] flex items-center justify-between">
            <span style={{ fontSize: 14, color: "rgba(0,0,0,0.6)" }}>
              已有{training.enroll_count ?? 232345}人报名
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: training.is_free ? "#FEA500" : "#0F62FE",
              }}
            >
              {formatPrice(training.is_free, training.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Shared data-fetching hook ─── */
function useTeacherData(teacherId: number) {
  const [item, setItem] = useState<TeacherProfile>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getTeacher(teacherId)
      .then((result) => {
        if (!cancelled) setItem(result.data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(getApiErrorMessage(err, "师资详情加载失败"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  return { item, error, loading };
}

/* ─── Header + Nav (render outside PageShell for full-width) ─── */
export function TeacherDetailHeader({ teacherId }: { teacherId: number }) {
  const { item, error, loading } = useTeacherData(teacherId);
  const [activeSection, setActiveSection] = useState<TabKey>("courses");

  useEffect(() => {
    const handleScroll = () => {
      const coursesEl = document.getElementById("courses-section");
      const trainingsEl = document.getElementById("trainings-section");
      if (!coursesEl || !trainingsEl) return;
      const navHeight = 48;
      const scrollY = window.scrollY + navHeight + 20;
      if (trainingsEl.getBoundingClientRect().top + window.scrollY <= scrollY) {
        setActiveSection("trainings");
      } else {
        setActiveSection("courses");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading || error || !item) return null;

  return (
    <>
      <TeacherHeaderSection teacher={item} />
      <TeacherNav activeSection={activeSection} />
    </>
  );
}

/* ─── Content sections (render inside PageShell) ─── */
export function TeacherDetailContent({ teacherId }: { teacherId: number }) {
  const { item, error, loading } = useTeacherData(teacherId);

  if (!Number.isFinite(teacherId) || teacherId <= 0) {
    return (
      <EmptyState
        title="师资不存在"
        action={
          <Link href="/teachers" className="text-sm text-primary">
            返回师资力量
          </Link>
        }
      />
    );
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner label="加载师资详情" />
      </div>
    );

  if (error || !item) {
    return (
      <EmptyState
        title="无法打开师资详情"
        description={error}
        action={
          <Link href="/teachers" className="text-sm text-primary">
            返回师资力量
          </Link>
        }
      />
    );
  }

  const courses = item.courses ?? [];
  const trainings = item.trainings ?? [];

  return (
    <div style={{ background: "#f6f8fc" }}>
      <div className="mx-auto max-w-[1200px]">
        {/* Courses Section */}
        <section id="courses-section">
          <h2
            className="font-semibold"
            style={{ fontSize: 20, color: "#222222" }}
          >
            课程教学{" "}
            <span style={{ fontSize: 14, color: "#0F62FE" }}>
              (共{courses.length})
            </span>
          </h2>
          {courses.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              暂无公开主讲课程。
            </p>
          ) : (
            <div
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              style={{ columnGap: 18, rowGap: 16 }}
            >
              {courses.map((course) => (
                <CourseCardItemStyled key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* Trainings Section */}
        <section id="trainings-section" style={{ marginTop: 33 }}>
          <h2
            className="font-semibold"
            style={{ fontSize: 20, color: "#222222" }}
          >
            培训项目{" "}
            <span style={{ fontSize: 14, color: "#0F62FE" }}>
              (共{trainings.length})
            </span>
          </h2>
          {trainings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              暂无关联培训项目。
            </p>
          ) : (
            <div
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              style={{ columnGap: 18, rowGap: 16 }}
            >
              {trainings.map((training) => (
                <TrainingCardItemStyled
                  key={training.id}
                  training={training}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
