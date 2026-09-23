"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/cover-image";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { MyFavoriteItem } from "@/entities/classroom";
import { unfavoriteCourse, unfavoriteTraining } from "@/features/learn/api";
import {
  classScheduleStatusLabel,
  formatDate,
  formatPrice,
  getLikeIconCount,
  trainingTypeColors,
  trainingTypeLabels,
} from "@/features/classroom/labels";
import { getApiErrorMessage } from "@/lib/forms";
import { getMyFavorites } from "./api";

/* ─── 常量 ─── */
const COURSE_PER_PAGE = 3;
const TRAINING_PER_PAGE = 2;

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

/* ─── 空状态 ─── */
function FavoriteEmpty({ text }: { text: string }) {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border"
      style={{ borderColor: "#ECECEC", background: "#fff" }}
    >
      <img
        src="/images/personal/collection-emty.png"
        alt=""
        className="h-[76px] w-[92px]"
        width={92}
        height={76}
      />
      <p className="mt-4 text-sm" style={{ color: "#555" }}>
        {text}
      </p>
    </div>
  );
}

/* ─── 收藏课程卡片（热门课程-全部课程列表样式 + 取消收藏按钮）─── */
function FavoriteCourseCard({
  item,
  onUnfavorite,
  busy,
}: {
  item: MyFavoriteItem;
  onUnfavorite: (item: MyFavoriteItem) => void;
  busy: boolean;
}) {
  const course = item.course;
  if (!course) return null;

  const likeCount = getLikeIconCount(course.like_count);
  const typeColor = trainingTypeColors[course.type] ?? "#555";
  const typeLabel = trainingTypeLabels[course.type] ?? course.type;

  return (
    <div className="overflow-hidden rounded-lg border border-[#ECECEC] bg-white">
      {/* 图片 */}
      <Link href={`/courses/${course.id}`} className="block">
        <div
          className="relative w-full"
          style={{ paddingBottom: "56.29%" }}
        >
          <CoverImage
            src={course.cover}
            alt={course.title}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </Link>
      {/* 内容 */}
      <div style={{ padding: "12px 17px 13px" }}>
        {/* 标题 */}
        <Link
          href={`/courses/${course.id}`}
          className="line-clamp-2 font-medium hover:text-primary"
          style={{ fontSize: 16, lineHeight: "24px", color: "#222" }}
        >
          {course.title}
        </Link>
        {/* 讲师 + 课时 */}
        <p className="mt-[10px]" style={{ fontSize: 14, color: "#555" }}>
          {course.teacher?.name ?? "中测讲师"}
          {course.lesson_count ? ` · ${course.lesson_count}课时` : ""}
        </p>
        {/* 推荐值 + 授课方式 */}
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
        {/* 分割线 */}
        <div
          className="mt-[14px]"
          style={{ height: 1, backgroundColor: "rgba(0,0,0,0.1)" }}
        />
        {/* 咨询课程 + 取消收藏 + 价格 */}
        <div className="mt-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/consult?source=favorite-course&course=${course.id}`}
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
            <button
              type="button"
              disabled={busy}
              onClick={() => onUnfavorite(item)}
              className="inline-flex cursor-pointer items-center rounded"
              style={{
                padding: "2px 7px",
                fontSize: 14,
                color: "#F16767",
                border: "1px solid #F16767",
                backgroundColor: "transparent",
              }}
            >
              {busy ? "取消中..." : "取消收藏"}
            </button>
          </div>
          <span style={{ fontSize: 16, color: "#0F62FE", fontWeight: 600 }}>
            {formatPrice(course.is_free, course.price)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── 收藏培训卡片（开班计划ScheduleCard样式 + 取消收藏按钮）─── */
function FavoriteTrainingCard({
  item,
  onUnfavorite,
  busy,
}: {
  item: MyFavoriteItem;
  onUnfavorite: (item: MyFavoriteItem) => void;
  busy: boolean;
}) {
  const training = item.training;
  if (!training) return null;

  const trainingType = training.type ?? "";
  const statusStyle = (() => {
    switch (training.status) {
      case "ongoing":
        return { bg: "#EAF1FC", color: "#0F62FE", label: "进行中" };
      case "pending":
        return { bg: "#F0F0F0", color: "#999999", label: "待开班" };
      case "finished":
        return { bg: "#FFF0F0", color: "#F16767", label: "已结束" };
      default:
        return {
          bg: "#F0F0F0",
          color: "#999999",
          label: classScheduleStatusLabel(training.status),
        };
    }
  })();

  const typeColor = (() => {
    switch (trainingType) {
      case "online":
        return "#F16767";
      case "offline":
        return "#0F62FE";
      case "mixed":
        return "#0F62FE";
      default:
        return "#0F62FE";
    }
  })();

  const targetHref = `/trainings/${training.slug}`;

  return (
    <div
      className="overflow-hidden rounded-xl bg-white"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: 16,
      }}
    >
      {/* 第一行：图片 + 标题/状态 */}
      <div className="flex gap-3">
        <Link
          href={targetHref}
          className="shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]"
          style={{ width: 168, height: 98 }}
        >
          <CoverImage
            src={training.cover}
            alt={training.title}
            className="h-full w-full"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={targetHref}
            className="line-clamp-2 text-[18px] leading-[24px] font-medium text-[#222222] hover:text-primary"
          >
            {training.title}
          </Link>
          <div className="mt-auto flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {statusStyle.label}
            </span>
            <span className="text-xs text-[#999999]">
              授课方式：
              <span style={{ color: typeColor }}>
                {trainingTypeLabels[trainingType] ?? trainingType}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 第二行：灰色信息块 */}
      <div
        className="mt-3 rounded-lg"
        style={{ background: "#F5F7FB", padding: "10px 9px" }}
      >
        {/* 所属培训 + 取消收藏 + 报名人数 */}
        <div className="flex items-center justify-between text-[14px]">
          <div className="min-w-0 flex-1">
            <span className="text-[#999999]">所属培训：</span>
            <span className="text-[#222222]">{training.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onUnfavorite(item)}
              className="inline-flex cursor-pointer items-center rounded"
              style={{
                height: 24,
                padding: "0 8px",
                fontSize: 14,
                color: "#F16767",
                border: "1px solid #F16767",
                backgroundColor: "transparent",
              }}
            >
              {busy ? "取消中..." : "取消收藏"}
            </button>
            <span className="text-[#999999]">报名人数：</span>
            <span className="font-medium text-[#0F62FE]">
              {training.enroll_count ?? 0}
            </span>
            <span className="text-[#999999]">
              /{training.max_students ?? "—"}人
            </span>
          </div>
        </div>
        {/* 时间 + 讲师 */}
        <div className="mt-2 flex items-center gap-4 text-[14px] text-[#222222]">
          <div className="flex items-center gap-1">
            <img
              src="/images/classplan/time-icon.png"
              alt=""
              width={16}
              height={16}
              className="shrink-0"
            />
            <span>
              {formatDate(training.start_at)}至{formatDate(training.end_at)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <img
              src="/images/classplan/people-icon.png"
              alt=""
              width={16}
              height={16}
              className="shrink-0"
            />
            <span>讲师{training.category?.name ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* 第三行：价格 + 按钮 */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 10 }}
      >
        <span
          className={`text-[16px] font-semibold ${
            training.is_free ? "text-[#FEA500]" : "text-[#0F62FE]"
          }`}
        >
          {formatPrice(training.is_free, training.price)}
        </span>
        <div className="flex gap-2">
          <Link
            href={targetHref}
            className="inline-flex items-center rounded-md bg-[#0F62FE] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0B53D9]"
          >
            报名
          </Link>
          <Link
            href={targetHref}
            className="inline-flex items-center rounded-md border border-[#0F62FE] px-4 py-1.5 text-sm font-medium text-[#0F62FE] transition-colors hover:bg-[#EAF1FC]"
          >
            试听
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── 收藏课程区域 ─── */
function FavoriteCourseSection() {
  const { toast } = useToast();
  const [items, setItems] = useState<MyFavoriteItem[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [busyId, setBusyId] = useState<number>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getMyFavorites({ type: "course", per_page: COURSE_PER_PAGE, page })
      .then((result) => {
        if (!cancelled) {
          setItems(result.data.data);
          setLastPage(result.data.last_page ?? 1);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleUnfavorite(item: MyFavoriteItem) {
    if (!item.course) return;
    setBusyId(item.id);
    try {
      await unfavoriteCourse(item.course.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (err) {
      toast({
        title: "取消收藏失败",
        description: getApiErrorMessage(err),
      });
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2
          className="text-[18px] font-semibold"
          style={{ color: "#222" }}
        >
          收藏课程
        </h2>
      </div>

      {/* 内容 */}
      <div className="mt-4">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner label="加载收藏课程" />
          </div>
        ) : error ? (
          <FavoriteEmpty text={error} />
        ) : items.length === 0 ? (
          <FavoriteEmpty text="暂时没有收藏课程" />
        ) : (
          <>
            <div
              className="grid grid-cols-1 gap-[15px] sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((item) => (
                <FavoriteCourseCard
                  key={item.id}
                  item={item}
                  onUnfavorite={handleUnfavorite}
                  busy={busyId === item.id}
                />
              ))}
            </div>
            {lastPage > 1 ? (
              <div className="mt-6">
                <Pagination
                  page={page}
                  lastPage={lastPage}
                  loading={loading}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── 收藏培训区域 ─── */
function FavoriteTrainingSection() {
  const { toast } = useToast();
  const [items, setItems] = useState<MyFavoriteItem[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [busyId, setBusyId] = useState<number>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getMyFavorites({
      type: "training",
      per_page: TRAINING_PER_PAGE,
      page,
    })
      .then((result) => {
        if (!cancelled) {
          setItems(result.data.data);
          setLastPage(result.data.last_page ?? 1);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleUnfavorite(item: MyFavoriteItem) {
    if (!item.training) return;
    setBusyId(item.id);
    try {
      await unfavoriteTraining(item.training.id);
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (err) {
      toast({
        title: "取消收藏失败",
        description: getApiErrorMessage(err),
      });
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2
          className="text-[18px] font-semibold"
          style={{ color: "#222" }}
        >
          收藏培训
        </h2>
      </div>

      {/* 内容 */}
      <div className="mt-4">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spinner label="加载收藏培训" />
          </div>
        ) : error ? (
          <FavoriteEmpty text={error} />
        ) : items.length === 0 ? (
          <FavoriteEmpty text="暂时没有收藏培训" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <FavoriteTrainingCard
                  key={item.id}
                  item={item}
                  onUnfavorite={handleUnfavorite}
                  busy={busyId === item.id}
                />
              ))}
            </div>
            {lastPage > 1 ? (
              <div className="mt-6">
                <Pagination
                  page={page}
                  lastPage={lastPage}
                  loading={loading}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── 主组件 ─── */
export function MyFavoritesPanel() {
  return (
    <div className="grid gap-0">
      <FavoriteCourseSection />
      {/* 分割线 */}
      <div
        className="my-6"
        style={{ height: 1, backgroundColor: "#ECECEC" }}
      />
      <FavoriteTrainingSection />
    </div>
  );
}
